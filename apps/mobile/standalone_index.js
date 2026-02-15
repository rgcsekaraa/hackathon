console.log("=== BUNDLE STARTING ===");
import { registerRootComponent } from 'expo';
import { View, Text } from 'react-native';

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <Text style={{ fontSize: 50, color: 'white' }}>STANDALONE APP</Text>
    </View>
  );
}

registerRootComponent(App);
