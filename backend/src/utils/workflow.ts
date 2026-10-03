export const WORKFLOW_STAGES = [
  'Site Assessment',
  'System Design',
  'Design Review',
  'Permit Submission',
  'Permit Approval',
  'Scheduling',
  'Installation',
  'Inspection',
  'Completion'
] as const;

export type WorkflowStage = typeof WORKFLOW_STAGES[number];

export const WORKFLOW_STATUSES = [
  'Not Started',
  'In Progress',
  'Blocked',
  'Completed',
  'Delayed'
] as const;

export type WorkflowStatus = typeof WORKFLOW_STATUSES[number];

export function validateStageTransition(
  currentStage: string,
  targetStage: string,
  currentStatus: string,
  userRole: string = 'Engineer',
  isOverride: boolean = false
): { valid: boolean; reason?: string } {
  if (isOverride || userRole === 'Admin') {
    return { valid: true };
  }

  if (!WORKFLOW_STAGES.includes(targetStage as any)) {
    return { valid: false, reason: `Invalid target stage: ${targetStage}` };
  }

  if (currentStatus === 'Blocked') {
    return { valid: false, reason: 'Job is currently BLOCKED. You must resolve the blocker before transitioning stages.' };
  }

  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage as any);
  const targetIndex = WORKFLOW_STAGES.indexOf(targetStage as any);

  if (currentIndex === -1 || targetIndex === -1) {
    return { valid: false, reason: 'Unknown stage index' };
  }

  // Moving forward 1 step
  if (targetIndex === currentIndex + 1) {
    return { valid: true };
  }

  // Moving backward (e.g. revision required)
  if (targetIndex < currentIndex) {
    return { valid: true };
  }

  // Skipping stages forward is restricted to Admin or override
  if (targetIndex > currentIndex + 1) {
    return {
      valid: false,
      reason: `Cannot skip stages from "${currentStage}" to "${targetStage}". Progression must be sequential or performed with Admin override.`
    };
  }

  return { valid: true };
}
