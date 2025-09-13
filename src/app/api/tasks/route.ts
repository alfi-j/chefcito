import { NextResponse } from 'next/server';
import { query } from '../lib/db';
import { Task } from '../lib/types';

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, assigneeId, reporterId, status, priority, dueDate, completedAt } = body;

    const result = await query(
      `INSERT INTO tasks 
       (id, title, description, assignee_id, reporter_id, status, priority, due_date, completed_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, title, description, assigneeId, reporterId, status, priority, dueDate, completedAt]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT /api/tasks/:id - Update a task
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, assigneeId, reporterId, status, priority, dueDate, completedAt } = body;

    const result = await query(
      `UPDATE tasks 
       SET title = $1, description = $2, assignee_id = $3, reporter_id = $4, status = $5, priority = $6, due_date = $7, completed_at = $8
       WHERE id = $9 RETURNING *`,
      [title, description, assigneeId, reporterId, status, priority, dueDate, completedAt, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}