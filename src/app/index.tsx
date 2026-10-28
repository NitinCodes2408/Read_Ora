import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Direct initial launch flow to onboarding
  return <Redirect href="/onboarding" />;
}
