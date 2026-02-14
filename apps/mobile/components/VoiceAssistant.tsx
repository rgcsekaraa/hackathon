import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Text, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../context/VoiceProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function VoiceAssistant() {
  const { connect, disconnect, isConnecting, isConnected, error, agentState } = useVoice();
  const insets = useSafeAreaInsets();
  
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isConnected && (agentState === 'speaking' || agentState === 'listening')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scale.setValue(1);
      // scale.stopAnimation(); // stopAnimation can leave it at current value
    }
  }, [agentState, isConnected]);

  const handlePress = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  if (!connect) return null; // Safety check

  return (
    <View style={[styles.container, { bottom: insets.bottom + 90 }]} pointerEvents="box-none">
       {error && (
         <View style={styles.errorContainer}>
           <Text style={styles.errorText}>{error}</Text>
         </View>
       )}
       
       <Animated.View style={[styles.buttonWrapper, { transform: [{ scale }] }]}>
          <Pressable 
            style={[
              styles.button, 
              isConnected && styles.buttonActive,
              isConnecting && styles.buttonConnecting
            ]}
            onPress={handlePress}
            disabled={isConnecting}
          >
             {isConnecting ? (
               <ActivityIndicator color="white" size="small" />
             ) : (
               <Ionicons 
                 name={isConnected ? "stop" : "mic"} 
                 size={28} 
                 color="white" 
               />
             )}
          </Pressable>
       </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 9999, // Ensure it's above everything
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6', // Blue-500
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonActive: {
    backgroundColor: '#ef4444', // Red-500 for Stop
  },
  buttonConnecting: {
    backgroundColor: '#64748b', // Slate-500
  },
  errorContainer: {
    position: 'absolute',
    bottom: 75,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 200,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  }
});
