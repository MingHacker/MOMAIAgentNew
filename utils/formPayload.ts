import dayjs from 'dayjs';

export const formDataToPayload = (
  type: 'feed' | 'sleep' | 'diaper' | 'outside',
  formData: any,
  userId: string
) => {
  const base = {
    userId,
    feed_times: [],
    sleep_records: [],
    diaper_changes: [],
    outside: []
  };

  switch (type) {
    case 'feed':
      return {
        ...base,
        feed_times: [{
          time: dayjs().format('YYYY-MM-DD') + ' ' + formData.feedTime,
          amount: parseInt(formData.feedAmount)
        }]
      };

    case 'sleep':
      return {
        ...base,
        sleep_records: [{
          start: dayjs().format('YYYY-MM-DD') + ' ' + formData.sleepStart,
          end: dayjs().format('YYYY-MM-DD') + ' ' + formData.sleepEnd
        }]
      };

    case 'diaper':
      return {
        ...base,
        diaper_changes: [{
          time: dayjs().format('YYYY-MM-DD') + ' ' + formData.diaperTime,
          poop: !!formData.diaperSolid
        }]
      };

    case 'outside':
      return {
        ...base,
        outside: [{
          duration: parseInt(formData.outsideDuration)
        }]
      };

    default:
      return base;
  }
};
