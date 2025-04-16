// utils/ageUtils.ts

export const getAgeInMonths = (birthday: string | Date): number => {
    const birthDate = typeof birthday === 'string' ? new Date(birthday) : birthday;
    const now = new Date();
  
    const yearDiff = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const dayDiff = now.getDate() - birthDate.getDate();
  
    let totalMonths = yearDiff * 12 + monthDiff;
  
    if (dayDiff < 0) {
      totalMonths -= 1;
    }
  
    return totalMonths;
  };
  