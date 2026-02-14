import { Redirect } from "expo-router";

/**
 * Root index redirects to the workspace screen.
 */
export default function Index() {
  return <Redirect href="/workspace" />;
}
