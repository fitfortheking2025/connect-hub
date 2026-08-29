import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { 
  User, 
  TeamMember, 
  FirstTimer, 
  Contribution, 
  Expense 
} from "../src/models";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

function extractInsertTuples(sql: string, tableName: string): string[] {
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`, "gi");
  const tuples: string[] = [];
  let match;

  while ((match = regex.exec(sql)) !== null) {
    const rawValues = match[1];
    const rows = rawValues.split(/\),\s*\(/g);
    for (const r of rows) {
      tuples.push(r.replace(/^\s*\(/, "").replace(/\)\s*$/, ""));
    }
  }

  return tuples;
}

function parseSqlTuple(row: string): (string | null | number)[] {
  const values: (string | null | number)[] = [];
  let current = "";
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const prevChar = i > 0 ? row[i - 1] : "";

    if ((char === "'" || char === '"') && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inString = false;
      } else {
        current += char;
      }
    } else if (char === "," && !inString) {
      values.push(cleanValue(current.trim()));
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim() !== "") {
    values.push(cleanValue(current.trim()));
  }

  return values;
}

function cleanValue(val: string): string | null | number {
  if (val === "NULL" || val === "null") return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (!isNaN(Number(val))) return Number(val);
  return val;
}

async function runMigration() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected successfully.\n");

  const sqlFilePath = path.resolve(process.cwd(), "scripts", "connect_system.sql");
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`SQL file not found at: ${sqlFilePath}`);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

  // 1. MIGRATE USERS
  console.log("Migrating `users` table...");
  const userTuples = extractInsertTuples(sqlContent, "users");
  const userMap = new Map<number, mongoose.Types.ObjectId>();

  for (const raw of userTuples) {
    const [id, username, passwordHash, fullName, createdAt] = parseSqlTuple(raw);
    const existing = await User.findOne({ username: String(username).toLowerCase() });
    
    const parsedDate = createdAt ? new Date(String(createdAt)) : new Date();

    if (!existing) {
      const doc = new User({
        username: String(username).toLowerCase(),
        passwordHash: String(passwordHash),
        fullName: fullName ? String(fullName) : "System Admin",
        role: "ADMIN",
        isActive: true,
        createdAt: parsedDate,
        updatedAt: parsedDate,
      });
      // Pass timestamps: false so Mongoose respects original date
      await doc.save({ timestamps: false });
      userMap.set(Number(id), doc._id);
    } else {
      userMap.set(Number(id), existing._id);
    }
  }
  console.log(`Users synced: ${userTuples.length}`);

  // 2. MIGRATE PERSONS -> TEAM MEMBERS
  console.log("Migrating `persons` table -> `TeamMember` collection...");
  const personTuples = extractInsertTuples(sqlContent, "persons");
  const personMap = new Map<number, mongoose.Types.ObjectId>();

  for (const raw of personTuples) {
    const [id, name, groupName, createdAt] = parseSqlTuple(raw);
    const memberName = String(name).trim();

    let mappedGroup: "Team Leaders" | "Follow Up Team" | "Members" = "Members";
    if (groupName === "Team Leaders") mappedGroup = "Team Leaders";

    const parsedDate = createdAt ? new Date(String(createdAt)) : new Date();

    let member = await TeamMember.findOne({ name: memberName });
    if (!member) {
      member = new TeamMember({
        name: memberName,
        groupName: mappedGroup,
        active: true,
        createdAt: parsedDate,
        updatedAt: parsedDate,
      });
      await member.save({ timestamps: false });
    }
    personMap.set(Number(id), member._id);
  }
  console.log(`Team members synced: ${personMap.size}`);

  // 3. MIGRATE FIRST TIMERS WITH EXACT ORIGINAL CREATED_AT
  console.log("Migrating `first_timers` table (preserving original monthly timestamps)...");
  const firstTimerTuples = extractInsertTuples(sqlContent, "first_timers");
  let firstTimerCount = 0;

  for (const raw of firstTimerTuples) {
    const [
      id,
      iam,
      fullname,
      gender,
      contact,
      age_group,
      messenger,
      service_attended,
      invited_by,
      lifegroup,
      connected_with,
      approached_by,
      texted_already,
      update_report,
      followed_up_by,
      started_one2one,
      created_at,
      updated_at,
    ] = parseSqlTuple(raw);

    let ageGroupNorm: "Youth" | "Young Adult" | "River Men" | "River Women" | "Seasoned" = "Young Adult";
    const ag = String(age_group).trim();
    if (ag === "Youth" || ag === "Young Adult" || ag === "River Men" || ag === "River Women" || ag === "Seasoned") {
      ageGroupNorm = ag;
    }

    let serviceNorm: "10AM" | "1PM" | "4PM" = "10AM";
    const s = String(service_attended).trim();
    if (s === "10AM" || s === "1PM" || s === "4PM") {
      serviceNorm = s;
    }

    // Force strict conversion to UTC Date object
    const exactCreatedAt = created_at ? new Date(String(created_at).replace(" ", "T") + "Z") : new Date();
    const exactUpdatedAt = updated_at ? new Date(String(updated_at).replace(" ", "T") + "Z") : exactCreatedAt;

    const firstTimerDoc = new FirstTimer({
      iam: String(iam).trim() as any,
      fullName: String(fullname).trim(),
      gender: Number(gender) || 0,
      contact: contact ? String(contact).trim() : "",
      ageGroup: ageGroupNorm,
      messenger: messenger ? String(messenger).trim() : "",
      serviceAttended: serviceNorm,
      invitedBy: invited_by ? String(invited_by).trim() : "",
      lifeGroupInterest: String(lifegroup).toUpperCase() === "YES" ? "YES" : "NO",
      connectedWith: connected_with ? String(connected_with).trim() : "",
      approachedBy: approached_by ? String(approached_by).trim() : "Unassigned",
      textedAlready: Boolean(Number(texted_already)),
      updateReport: update_report ? String(update_report).trim() : "",
      followedUpBy: followed_up_by ? String(followed_up_by).trim() : "",
      startedOne2One: Boolean(Number(started_one2one)),
      createdAt: exactCreatedAt,
      updatedAt: exactUpdatedAt,
    });

    // Explicitly bypass Mongoose timestamps hook so exactCreatedAt is never overridden
    await firstTimerDoc.save({ timestamps: false });
    firstTimerCount++;
  }
  console.log(`First timers synced: ${firstTimerCount} records with preserved timestamps.`);

  // 4. MIGRATE CONTRIBUTIONS
  console.log("Migrating `contributions` table...");
  const contributionTuples = extractInsertTuples(sqlContent, "contributions");
  let contributionCount = 0;

  for (const raw of contributionTuples) {
    const [id, person_id, month, year, amount, created_at] = parseSqlTuple(raw);
    const memberMongoId = personMap.get(Number(person_id));

    if (memberMongoId) {
      const exactCreatedAt = created_at ? new Date(String(created_at).replace(" ", "T") + "Z") : new Date();

      const contribDoc = new Contribution({
        memberId: memberMongoId,
        month: Number(month),
        year: Number(year) || 2026,
        amount: Number(amount) || 100.0,
        createdAt: exactCreatedAt,
        updatedAt: exactCreatedAt,
      });

      await contribDoc.save({ timestamps: false });
      contributionCount++;
    }
  }
  console.log(`Contributions synced: ${contributionCount}`);

  // 5. MIGRATE EXPENSES
  console.log("Migrating `expenses` table...");
  const expenseTuples = extractInsertTuples(sqlContent, "expenses");
  let expenseCount = 0;

  for (const raw of expenseTuples) {
    const [id, expenses_name, amount, created_at] = parseSqlTuple(raw);
    const exactCreatedAt = created_at ? new Date(String(created_at).replace(" ", "T") + "Z") : new Date();

    const expenseDoc = new Expense({
      expenseName: String(expenses_name),
      amount: Number(amount),
      createdAt: exactCreatedAt,
      updatedAt: exactCreatedAt,
    });

    await expenseDoc.save({ timestamps: false });
    expenseCount++;
  }
  console.log(`Expenses synced: ${expenseCount}`);

  console.log("\nMigration completed successfully with preserved timestamps!");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});