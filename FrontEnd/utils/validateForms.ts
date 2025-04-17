// utils/validateForms.ts

export function validateFormData(
    type: 'feeding' | 'sleep' | 'diaper' | 'outside' | null,
    data: any
  ): boolean {
    if (!type) return false;
  
    switch (type) {
      case 'feeding':
        return !!data.feedTime && !!data.feedAmount;
  
      case 'sleep':
        return !!data.sleepStart && !!data.sleepEnd;
  
      case 'diaper':
        return !!data.diaperTime && data.diaperSolid !== undefined;
  
      case 'outside':
        return !!data.outsideDuration;
  
      default:
        return false;
    }
  }
  