import { useState, useEffect } from 'react';
import AppleHealthKit, { HealthInputOptions, HealthKitPermissions } from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
};

export const useAppleHealth = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = () => {
    setLoading(true);
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) {
        setError('HealthKit authorization failed');
        setLoading(false);
        return;
      }

      const today = new Date();
      const options: HealthInputOptions = {
        startDate: new Date(today.setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getHeartRateVariabilitySamples(options, (err, hrv) => {
        if (err || !hrv?.length) {
          setError('No HRV data');
          setLoading(false);
          return;
        }

        AppleHealthKit.getStepCount(options, (err, steps) => {
          AppleHealthKit.getSleepSamples(options, (err, sleep) => {
            const sleepMinutes = sleep.reduce((total, s) => {
              if (s.value === 1) {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                return total + duration;
              }
              return total;
            }, 0);

            setData({
              hrv: hrv[0].value,
              steps: steps.value,
              sleep: Math.round(sleepMinutes / 60 * 10) / 10,
            });
            setLoading(false);
          });
        });
      });
    });
  };

  return { data, loading, error, fetchHealthData };
};
