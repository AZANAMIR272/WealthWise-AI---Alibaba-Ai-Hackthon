import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import * as engine from '@/lib/financial-engine';
import { seedDemoData, getDemoUserId } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only seed demo data if current user is the demo user
    if (userId === getDemoUserId()) {
      await seedDemoData();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'snapshot';

    switch (type) {
      case 'snapshot': return NextResponse.json(await engine.getFinancialSnapshot(userId));
      case 'risk': return NextResponse.json(await engine.getRiskRadar(userId));
      case 'goals': return NextResponse.json(await engine.analyzeGoals(userId));
      case 'safe-to-spend': return NextResponse.json(await engine.calculateSafeToSpend(userId));
      case 'projection': {
        const months = parseInt(searchParams.get('months') || '6');
        return NextResponse.json(await engine.getProjection(userId, months));
      }
      case 'stress-test': {
        const scenario = searchParams.get('scenario') || 'salary_delay';
        const params: Record<string, number> = {};
        if (searchParams.get('days')) params.days = parseInt(searchParams.get('days')!);
        if (searchParams.get('percentage')) params.percentage = parseInt(searchParams.get('percentage')!);
        if (searchParams.get('amount')) params.amount = parseInt(searchParams.get('amount')!);
        return NextResponse.json(await engine.runStressTest(userId, scenario, params));
      }
      default: return NextResponse.json(await engine.getFinancialSnapshot(userId));
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.type === 'simulate') {
      return NextResponse.json(await engine.simulateScenario(userId, body.query));
    }
    if (body.type === 'coach') {
      return NextResponse.json(await engine.getCoachResponse(userId, body.question));
    }
    if (body.type === 'stress-test') {
      return NextResponse.json(await engine.runStressTest(userId, body.scenario, body.params || {}));
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
