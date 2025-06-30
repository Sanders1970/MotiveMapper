'use client';

import { Award, TrendingUp, Zap, Users, Shield, GitMerge, Goal, Lightbulb, type LucideProps } from "lucide-react";
import React from "react";

const motivationIcons: { [key: string]: React.ElementType<LucideProps> } = {
  achievement: Award,
  accomplishment: Award,
  growth: TrendingUp,
  development: TrendingUp,
  power: Zap,
  influence: Zap,
  social: Users,
  affiliation: Users,
  community: Users,
  security: Shield,
  stability: Shield,
  autonomy: GitMerge,
  independence: GitMerge,
  purpose: Goal,
  meaning: Goal,
  incentive: Award,
  mastery: TrendingUp,
};

export const MotivationIcon = ({ motivation, ...props }: { motivation: string } & LucideProps) => {
  const keyword = motivation.toLowerCase().split(' ')[0].replace(/[^a-z]/gi, '');
  const Icon = motivationIcons[keyword] || Lightbulb;
  return <Icon {...props} />;
};
