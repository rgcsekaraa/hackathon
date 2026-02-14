import { Redirect } from "expo-router";

/**
 * Root index redirects to the leads tab (tradie dashboard).
 */
export default function Index() {
  return <Redirect href="/(tabs)/dashboard" />;
}
