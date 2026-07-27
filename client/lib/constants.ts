import { AvatarId, CardType } from "@/types/game";

export const CARD_ASSETS: Record<CardType | "back", string> = {
  citizen: "/assets/citizen.jpg",
  emperor: "/assets/emperor.jpg",
  slave: "/assets/slave.jpg",
  back: "/assets/back.jpg",
};

export const CARD_LABELS: Record<CardType, string> = {
  citizen: "Citizen",
  emperor: "Emperor",
  slave: "Slave",
};

export const AVATAR_ASSETS: Record<AvatarId, string> = {
  "avatar-1": "/avatars/avatar-1.png",
  "avatar-2": "/avatars/avatar-2.png",
  "avatar-3": "/avatars/avatar-3.png",
  "avatar-4": "/avatars/avatar-4.png",
  "avatar-5": "/avatars/avatar-5.png",
};

export const AVATAR_LABELS: Record<AvatarId, string> = {
  "avatar-1": "Shadow",
  "avatar-2": "Rogue",
  "avatar-3": "Oracle",
  "avatar-4": "Viper",
  "avatar-5": "Tonegawa",
};

export const AVATAR_LIST: AvatarId[] = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
];

export const ROLE_LABELS: Record<"emperor_side" | "slave_side", string> = {
  emperor_side: "Emperor Side",
  slave_side: "Slave Side",
};

export const ALL_CARD_ASSET_URLS: string[] = Object.values(CARD_ASSETS);
