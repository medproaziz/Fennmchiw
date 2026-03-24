/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type City = 'الدار البيضاء' | 'الرباط' | 'مراكش' | 'طنجة' | 'أكادير' | 'فاس';

export type Interest = 'قهاوي' | 'ريسطورات' | 'نشاط' | 'فخامة' | 'أنشطة' | 'سهرات' | 'ثقافة';

export type Personality = 'هادي' | 'اجتماعي' | 'مغامر';

export type BudgetLevel = 1 | 2 | 3 | 4; // 1: Cheap, 4: Luxury

export type ActivityType = 'قهوة' | 'ماكلة' | 'نشاط' | 'حركة' | 'تسارية';

export type SessionStatus = 'searching' | 'matched' | 'confirmed' | 'expired';
export type MatchGroupStatus = 'pending' | 'confirmed' | 'completed';

export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  city: City;
  interests: Interest[];
  personality: Personality;
  budget: BudgetLevel;
  photoURL?: string;
  createdAt: number;
  friendCount?: number;
  outingCount?: number;
  rating?: number;
}

export interface Session {
  id: string;
  userId: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  activityType: ActivityType;
  status: SessionStatus;
  city: City;
  matchGroupId?: string; // ID of the group match
  lastSeen?: number;
  createdAt: number;
}

export interface Place {
  id: string;
  name: string;
  city: City;
  type: ActivityType;
  priceLevel: BudgetLevel;
  vibe: Personality[];
  imageUrl: string;
  rating: number;
  location: string;
}

export interface MatchGroup {
  id: string;
  userIds: string[];
  placeId: string;
  suggestedPlace: Place;
  startTime: string;
  endTime: string;
  status: MatchGroupStatus;
  createdAt: number;
}
