export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: '₹0',
    interval: 'month',
    limits: {
      reposPerDay: 5,
      exportsPerDay: 3,
      maxRepoSizeMB: 50,
      backgroundJobsPerDay: 0,
      historyRetentionDays: 7,
    },
    features: [
      '5 repos/day',
      '3 exports/day',
      'Max repo size 50MB',
      'Foreground processing only',
      '7-day history retention'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '₹299',
    interval: 'month',
    limits: {
      reposPerDay: 50,
      exportsPerDay: 30,
      maxRepoSizeMB: 500,
      backgroundJobsPerDay: 10,
      historyRetentionDays: 30,
    },
    features: [
      '50 repos/day',
      '30 exports/day',
      'Max repo size 500MB',
      'Minified & chunked exports',
      '10 background jobs/day',
      '30-day history retention'
    ]
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: '₹799',
    interval: 'month',
    limits: {
      reposPerDay: Infinity,
      exportsPerDay: Infinity,
      maxRepoSizeMB: Infinity,
      backgroundJobsPerDay: Infinity,
      historyRetentionDays: Infinity,
    },
    features: [
      'Unlimited repos',
      'Unlimited exports',
      'No size limit',
      'Unlimited background jobs',
      'Full export suite',
      'Unlimited history retention',
      'Priority processing queue'
    ]
  }
};
export type PlanId = keyof typeof PLANS;
