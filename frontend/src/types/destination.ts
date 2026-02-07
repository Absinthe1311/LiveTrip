// 目的地相关类型定义

export interface Attraction {
  id: string;
  name: string;
  image: string;
  rating: number;
  description: string;
  openTime: string;
  ticketPrice: number;
  category: string;
}

export interface DestinationDetail {
  id: string;
  name: string;
  icon: string;
  days: number;
  budget: number;
  bestSeason: string;
  rating: number;
  description: string;
  tags: string[];
  heroImage: string;
  attractions: Attraction[];
}
