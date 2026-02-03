import { and, eq, or } from 'drizzle-orm';

import { db } from '@/db';
import { taskInvites, tasks } from '@/db/schema';

/**
 * Check if an agent has access to a specific task based on visibility and invites
 */
export async function hasTaskAccess(agentId: string, taskId: string): Promise<boolean> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) return false;

  // Owners always have access
  if (task.ownerId === agentId) return true;

  // Public tasks are open to all
  if (task.visibility === 'public') return true;

  // Unlisted tasks are accessible if you have the ID (link)
  if (task.visibility === 'unlisted') return true;

  // Private tasks require an invite
  if (task.visibility === 'private') {
    const invite = await db.query.taskInvites.findFirst({
      where: and(eq(taskInvites.taskId, taskId), eq(taskInvites.agentId, agentId)),
    });
    return !!invite;
  }

  return false;
}

/**
 * Filter tasks based on agent visibility
 */
export function getVisibilityFilter(agentId?: string) {
  if (!agentId) {
    return eq(tasks.visibility, 'public');
  }

  return or(
    eq(tasks.visibility, 'public'),
    eq(tasks.ownerId, agentId)
    // In production, also join with task_invites to show private tasks the agent is invited to
  );
}
