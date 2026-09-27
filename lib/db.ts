import { prisma } from "./prisma";
import fs from "fs";
import path from "path";
import { InterviewSession } from "./types/interview";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  provider?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: InterviewSession[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "mentra.json");

const IS_DEV = process.env.NODE_ENV !== "production";

function ensureDbFile(): DatabaseSchema {
  if (!IS_DEV) return { users: [], sessions: [] };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: [],
        sessions: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return { users: [], sessions: [] };
  }
}

function writeDb(data: DatabaseSchema) {
  if (!IS_DEV) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Local backup write error:", e);
  }
}

export class Database {
  // --- USERS ---
  static async createUser(name: string, email: string, passwordHash: string, avatarUrl?: string): Promise<UserRecord> {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const created = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          avatarUrl: avatarUrl || null,
          provider: "credentials"
        }
      });

      const userRecord: UserRecord = {
        id: created.id,
        name: created.name,
        email: created.email,
        passwordHash: created.passwordHash || "",
        avatarUrl: created.avatarUrl || undefined,
        provider: created.provider || undefined,
        createdAt: created.createdAt.toISOString()
      };

      // Sync to local backup
      const localDb = ensureDbFile();
      localDb.users = localDb.users.filter(u => u.email !== cleanEmail);
      localDb.users.push(userRecord);
      writeDb(localDb);

      return userRecord;
    } catch (dbErr: any) {
      console.warn("Prisma createUser error, using local fallback:", dbErr?.message);
      
      const localDb = ensureDbFile();
      const existing = localDb.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        throw new Error("User with this email already exists");
      }

      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email: cleanEmail,
        passwordHash,
        avatarUrl,
        createdAt: new Date().toISOString()
      };

      localDb.users.push(newUser);
      writeDb(localDb);
      return newUser;
    }
  }

  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.toLowerCase().trim();

    try {
      const found = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (found) {
        return {
          id: found.id,
          name: found.name,
          email: found.email,
          passwordHash: found.passwordHash || "",
          avatarUrl: found.avatarUrl || undefined,
          provider: found.provider || undefined,
          createdAt: found.createdAt.toISOString()
        };
      }
    } catch (e) {
      console.warn("Prisma findUserByEmail fallback:", e);
    }

    const localDb = ensureDbFile();
    return localDb.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  static async findUserById(id: string): Promise<UserRecord | null> {
    try {
      const found = await prisma.user.findUnique({
        where: { id }
      });

      if (found) {
        return {
          id: found.id,
          name: found.name,
          email: found.email,
          passwordHash: found.passwordHash || "",
          avatarUrl: found.avatarUrl || undefined,
          provider: found.provider || undefined,
          createdAt: found.createdAt.toISOString()
        };
      }
    } catch (e) {
      console.warn("Prisma findUserById fallback:", e);
    }

    const localDb = ensureDbFile();
    return localDb.users.find(u => u.id === id) || null;
  }

  static async updateUserPassword(email: string, newPasswordHash: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    try {
      await prisma.user.update({
        where: { email: cleanEmail },
        data: { passwordHash: newPasswordHash }
      });
    } catch (e) {
      console.warn("Prisma updateUserPassword fallback:", e);
    }

    const localDb = ensureDbFile();
    const user = localDb.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.passwordHash = newPasswordHash;
      writeDb(localDb);
    }
    return true;
  }

  // --- SESSIONS ---
  static async saveSession(session: InterviewSession): Promise<InterviewSession> {
    try {
      await prisma.interviewSession.upsert({
        where: { id: session.id },
        update: {
          userId: session.userId || null,
          jobDescription: session.jobDescription,
          role: session.role || null,
          company: session.company || null,
          culture: session.culture || null,
          mode: session.mode || "full",
          status: session.status || "in_progress",
          readinessScore: session.readinessScore !== undefined ? session.readinessScore : null,
          technicalScore: session.categoryScores?.technical !== undefined ? session.categoryScores.technical : null,
          behavioralScore: session.categoryScores?.behavioral !== undefined ? session.categoryScores.behavioral : null,
          communicationScore: session.categoryScores?.communication !== undefined ? session.categoryScores.communication : null,
          consistencyScore: session.categoryScores?.consistency !== undefined ? session.categoryScores.consistency : null,
          overallSummary: session.overallSummary || null,
          weakTopics: session.weakTopics ? JSON.parse(JSON.stringify(session.weakTopics)) : [],
          strengths: session.strengths ? JSON.parse(JSON.stringify(session.strengths)) : [],
          recommendedActions: session.recommendedActions ? JSON.parse(JSON.stringify(session.recommendedActions)) : [],
          difficultyAdjustment: session.difficultyAdjustment ? JSON.parse(JSON.stringify(session.difficultyAdjustment)) : null,
          questions: JSON.parse(JSON.stringify(session.questions || [])),
          completedAt: session.completedAt ? new Date(session.completedAt) : null
        },
        create: {
          id: session.id,
          userId: session.userId || null,
          jobDescription: session.jobDescription,
          role: session.role || null,
          company: session.company || null,
          culture: session.culture || null,
          mode: session.mode || "full",
          status: session.status || "in_progress",
          readinessScore: session.readinessScore !== undefined ? session.readinessScore : null,
          technicalScore: session.categoryScores?.technical !== undefined ? session.categoryScores.technical : null,
          behavioralScore: session.categoryScores?.behavioral !== undefined ? session.categoryScores.behavioral : null,
          communicationScore: session.categoryScores?.communication !== undefined ? session.categoryScores.communication : null,
          consistencyScore: session.categoryScores?.consistency !== undefined ? session.categoryScores.consistency : null,
          overallSummary: session.overallSummary || null,
          weakTopics: session.weakTopics ? JSON.parse(JSON.stringify(session.weakTopics)) : [],
          strengths: session.strengths ? JSON.parse(JSON.stringify(session.strengths)) : [],
          recommendedActions: session.recommendedActions ? JSON.parse(JSON.stringify(session.recommendedActions)) : [],
          difficultyAdjustment: session.difficultyAdjustment ? JSON.parse(JSON.stringify(session.difficultyAdjustment)) : null,
          questions: JSON.parse(JSON.stringify(session.questions || [])),
          createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
          completedAt: session.completedAt ? new Date(session.completedAt) : null
        }
      });
    } catch (e) {
      console.warn("Prisma saveSession error, syncing to local fallback:", e);
    }

    // Sync to local file
    const localDb = ensureDbFile();
    const idx = localDb.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      localDb.sessions[idx] = session;
    } else {
      localDb.sessions.push(session);
    }
    writeDb(localDb);

    return session;
  }

  static async getSession(id: string): Promise<InterviewSession | null> {
    try {
      const found = await prisma.interviewSession.findUnique({
        where: { id }
      });

      if (found) {
        return {
          id: found.id,
          userId: found.userId || undefined,
          jobDescription: found.jobDescription,
          role: found.role || undefined,
          company: found.company || undefined,
          culture: found.culture || undefined,
          mode: found.mode as any,
          status: found.status as any,
          currentQuestionIndex: 0,
          readinessScore: found.readinessScore ?? undefined,
          categoryScores: found.technicalScore !== null ? {
            technical: found.technicalScore || 80,
            behavioral: found.behavioralScore || 80,
            communication: found.communicationScore || 80,
            consistency: found.consistencyScore || 80
          } : undefined,
          overallSummary: found.overallSummary || undefined,
          weakTopics: (found.weakTopics as any) || [],
          strengths: (found.strengths as any) || [],
          recommendedActions: (found.recommendedActions as any) || [],
          difficultyAdjustment: (found.difficultyAdjustment as any) || undefined,
          questions: (found.questions as any) || [],
          createdAt: found.createdAt.toISOString(),
          completedAt: found.completedAt ? found.completedAt.toISOString() : undefined
        };
      }
    } catch (e) {
      console.warn("Prisma getSession fallback:", e);
    }

    const localDb = ensureDbFile();
    return localDb.sessions.find(s => s.id === id) || null;
  }

  static async getUserSessions(userId?: string): Promise<InterviewSession[]> {
    if (!userId) {
      return [];
    }

    try {
      const found = await prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });

      if (found.length > 0) {
        return found.map(s => ({
          id: s.id,
          userId: s.userId || undefined,
          jobDescription: s.jobDescription,
          role: s.role || undefined,
          company: s.company || undefined,
          culture: s.culture || undefined,
          mode: s.mode as any,
          status: s.status as any,
          currentQuestionIndex: 0,
          readinessScore: s.readinessScore ?? undefined,
          categoryScores: s.technicalScore !== null ? {
            technical: s.technicalScore || 80,
            behavioral: s.behavioralScore || 80,
            communication: s.communicationScore || 80,
            consistency: s.consistencyScore || 80
          } : undefined,
          overallSummary: s.overallSummary || undefined,
          weakTopics: (s.weakTopics as any) || [],
          strengths: (s.strengths as any) || [],
          recommendedActions: (s.recommendedActions as any) || [],
          difficultyAdjustment: (s.difficultyAdjustment as any) || undefined,
          questions: (s.questions as any) || [],
          createdAt: s.createdAt.toISOString(),
          completedAt: s.completedAt ? s.completedAt.toISOString() : undefined
        }));
      }
    } catch (e) {
      console.warn("Prisma getUserSessions fallback:", e);
    }

    const localDb = ensureDbFile();
    const list = localDb.sessions.filter(s => s.userId === userId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getDashboardStats(userId?: string) {
    if (!userId) {
      return {
        sessions: [],
        averageReadiness: 0,
        avgTechDepth: 0,
        avgBehavioral: 0,
        avgClarity: 0,
        scoreDelta: 0,
        recurringWeakTopics: []
      };
    }

    const all = await this.getUserSessions(userId);
    const completed = all.filter(s => s.status === "completed" && s.readinessScore !== undefined);

    const hasCompleted = completed.length > 0;

    const avgReadiness = hasCompleted
      ? Math.round(completed.reduce((sum, s) => sum + (s.readinessScore || 0), 0) / completed.length)
      : 0;

    let totalTech = 0;
    let totalBeh = 0;
    let totalClarity = 0;
    let categoryCount = 0;

    completed.forEach(s => {
      if (s.categoryScores) {
        totalTech += s.categoryScores.technical || 0;
        totalBeh += s.categoryScores.behavioral || 0;
        totalClarity += s.categoryScores.communication || 0;
        categoryCount++;
      }
    });

    const avgTechDepth = categoryCount > 0 ? +((totalTech / categoryCount) / 10).toFixed(1) : 0;
    const avgBehavioral = categoryCount > 0 ? +((totalBeh / categoryCount) / 10).toFixed(1) : 0;
    const avgClarity = categoryCount > 0 ? +((totalClarity / categoryCount) / 10).toFixed(1) : 0;

    let scoreDelta = 0;
    if (completed.length >= 2) {
      const sorted = [...completed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const first = sorted[0]?.readinessScore || 0;
      const latest = sorted[sorted.length - 1]?.readinessScore || 0;
      scoreDelta = latest - first;
    }

    const weakTopicFreq = new Map<string, { count: number; totalScore: number; advice: string }>();
    completed.forEach(s => {
      s.weakTopics?.forEach(w => {
        const existing = weakTopicFreq.get(w.topic) || { count: 0, totalScore: 0, advice: w.advice };
        weakTopicFreq.set(w.topic, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (w.score || 0),
          advice: w.advice
        });
      });
    });

    const recurringWeakTopics = Array.from(weakTopicFreq.entries()).map(([topic, data]) => ({
      topic,
      frequency: data.count,
      avgScore: +(data.totalScore / data.count).toFixed(1),
      advice: data.advice
    })).sort((a, b) => b.frequency - a.frequency);

    return {
      totalSessions: all.length,
      completedSessions: completed.length,
      averageReadiness: avgReadiness,
      avgTechDepth,
      avgBehavioral,
      avgClarity,
      scoreDelta,
      sessions: all,
      recurringWeakTopics
    };
  }
}
