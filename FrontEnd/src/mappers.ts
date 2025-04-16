import { DateTime } from 'luxon';
import { BabyProfile } from './api'; // Assuming api.ts is in the same directory

// Define the structure for Baby Info used in the Dashboard
export interface BabyInfo {
  id: string;
  name: string;
  avatar: string; // Assuming avatar URL comes from profile or a default
  weight: string; // Format as string e.g., "10.5 kg"
  height: string; // Format as string e.g., "81 cm"
  age: string; // Format as string e.g., "1 year 3 months" or "5 months"
}

// Placeholder for avatar logic - replace with actual logic if available
// Accepts null profile for default avatar case
function getAvatarUrl(profile: BabyProfile | null): string {
  // TODO: Implement logic to get avatar URL, maybe from profile or default
  // Example: if (profile && profile.avatar_url) return profile.avatar_url;
  return 'https://via.placeholder.com/60'; // Default placeholder
}

// Calculates age string from birth date
function calculateAgeString(birthDateISO: string): string {
  const birthDate = DateTime.fromISO(birthDateISO);
  const now = DateTime.now();
  const diff = now.diff(birthDate, ['years', 'months', 'days']).toObject();

  const years = Math.floor(diff.years ?? 0);
  const months = Math.floor(diff.months ?? 0);
  // const days = Math.floor(diff.days ?? 0); // Usually not shown with years/months

  if (years >= 1) {
    const yearStr = years === 1 ? '1 year' : `${years} years`;
    const monthStr = months === 1 ? '1 month' : months > 0 ? `${months} months` : '';
    return `${yearStr}${monthStr ? ` ${monthStr}` : ''}`;
  } else if (months >= 1) {
    return months === 1 ? '1 month' : `${months} months`;
  } else {
    // Could show days for very young infants
    const days = Math.floor(now.diff(birthDate, 'days').days);
    return days === 1 ? '1 day' : `${days} days`;
  }
}

// Mapper function - Accepts BabyProfile or null
export function mapBabyProfileToBabyInfo(profile: BabyProfile | null): BabyInfo {
  if (!profile) {
    // Handle null profile case (e.g., no baby selected or error)
    return {
        id: '',
        name: 'No Baby Selected',
        avatar: getAvatarUrl(profile), // Default avatar
        weight: '-',
        height: '-',
        age: '-',
    };
  }
  return {
    id: profile.id,
    name: profile.name,
    avatar: getAvatarUrl(profile), // Use placeholder logic for now
    weight: `${profile.birth_weight} kg`, // Assuming birth_weight is current weight for now
    height: `${profile.birth_height} cm`, // Assuming birth_height is current height for now
    age: calculateAgeString(profile.birth_date),
  };
}
