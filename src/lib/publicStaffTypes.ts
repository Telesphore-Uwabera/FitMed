export type PublicTeamMember = {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  bio: string;
  image: string;
  badge: string;
  kind: "admin" | "doctor";
  license?: string;
  specialty?: string;
};
