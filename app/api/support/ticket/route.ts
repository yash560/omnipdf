import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/auth/jwt';
import { getMongoDb } from '@/lib/db/mongodb';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  userName: string;
  userEmail: string;
  category: 'bug' | 'feature' | 'drive' | 'vault' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  diagnostics?: {
    browser?: string;
    os?: string;
    screenResolution?: string;
    onlineStatus?: boolean;
    wasmSupported?: boolean;
    localTime?: string;
    userAgent?: string;
  };
  status: 'open' | 'in_review' | 'resolved';
  createdAt: number;
}

// In-memory fallback if MongoDB is in offline mode
const ticketsMemory: SupportTicket[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, category, priority, subject, message, diagnostics } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, subject, and message are required.' },
        { status: 400 }
      );
    }

    // Optional auth extraction
    let userId: string | undefined;
    let token = req.cookies.get('omnipdf_token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = await verifyUserToken(token);
      if (payload && payload.sub) {
        userId = payload.sub;
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `FC-${randomSuffix}`;
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketNumber,
      userId,
      userName: name.trim(),
      userEmail: email.trim().toLowerCase(),
      category: category || 'general',
      priority: priority || 'medium',
      subject: subject.trim(),
      message: message.trim(),
      diagnostics: diagnostics || {},
      status: 'open',
      createdAt: Date.now(),
    };

    // Save in MongoDB
    try {
      const db = await getMongoDb();
      const collection = db.collection<SupportTicket>('filecraft_support_tickets');
      await collection.insertOne(newTicket);
    } catch (err) {
      console.warn('[FileCraft Support] MongoDB fallback to memory:', err);
      ticketsMemory.push(newTicket);
    }

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: `Support ticket ${ticketNumber} created successfully! Yash will respond to your query shortly.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
