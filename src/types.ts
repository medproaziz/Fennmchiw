/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type City = 'الدار البيضاء' | 'الرباط' | 'مراكش' | 'طنجة' | 'أكادير' | 'فاس';

export type Interest = 'قهاوي' | 'ريسطورات' | 'نشاط' | 'فخامة' | 'أنشطة' | 'سهرات' | 'ثقافة' | 'رياضة' | 'ألعاب' | 'سينما' | 'موسيقى' | 'طبيعة' | 'تصوير';

export type Personality = 'هادي' | 'اجتماعي' | 'مغامر';

export type BudgetLevel = 1 | 2 | 3 | 4; // 1: Cheap, 4: Luxury

export type ActivityType = 'قهوة' | 'ماكلة' | 'نشاط' | 'حركة' | 'تسارية';

export type SessionStatus = 'searching' | 'matched' | 'confirmed' | 'expired';
export type MatchGroupStatus = 'pending' | 'confirmed' | 'completed';

export interface UserProfile {
  uid: string;
  name: string;
  displayName: string; // Alias for name
  age: number;
  city: City;
  interests: Interest[];
  personality: Personality;
  vibe?: string; // Short vibe description
  budget: BudgetLevel;
  photoURL?: string;
  createdAt: number;
  friendCount?: number;
  outingCount?: number;
  rating?: number;
  ratingCount?: number;
  soundEnabled?: boolean;
}

export interface Session {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  interests?: string[];
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
  mapUrl?: string;
}

export interface MatchGroup {
  id: string;
  city?: string;
  activityType?: string;
  date?: string;
  userIds: string[];
  members?: {
    id: string;
    name: string;
    avatar: string;
    interests: string[];
    metadata?: any;
  }[];
  placeId: string;
  suggestedPlace: Place;
  startTime: string;
  endTime: string;
  status: MatchGroupStatus;
  confirmedUserIds?: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface UserRating {
  id?: string;
  fromUserId: string;
  toUserId: string;
  matchId: string;
  score: number;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'match' | 'message' | 'system';
  read: boolean;
  link?: string;
  createdAt: number;
}
