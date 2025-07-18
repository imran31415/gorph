import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';

type ValidationStatus = 'valid' | 'invalid' | 'pending' | 'empty';

interface ValidationIconProps {
  status: ValidationStatus;
  errorMessage?: string | null;
  size?: number;
}

export default function ValidationIcon({ status, errorMessage, size = 16 }: ValidationIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getIcon = () => {
    switch (status) {
      case 'valid':
        return '✅';
      case 'invalid':
        return '❌';
      case 'pending':
        return '⏳';
      case 'empty':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'valid':
        return '#10b981'; // green
      case 'invalid':
        return '#ef4444'; // red
      case 'pending':
        return '#f59e0b'; // amber
      case 'empty':
        return '#9ca3af'; // gray
      default:
        return '#9ca3af';
    }
  };

  const handlePress = () => {
    if (status === 'invalid' && errorMessage) {
      if (Platform.OS === 'web') {
        // On web, we could implement a proper tooltip
        setShowTooltip(!showTooltip);
        setTimeout(() => setShowTooltip(false), 3000);
      } else {
        // On mobile, show an alert
        Alert.alert('Validation Error', errorMessage);
      }
    }
  };

  const iconElement = (
    <TouchableOpacity
      onPress={handlePress}
      disabled={status !== 'invalid' || !errorMessage}
      style={[
        styles.iconContainer,
        { opacity: status === 'empty' ? 0.5 : 1 }
      ]}
    >
      <Text style={[styles.icon, { fontSize: size, color: getColor() }]}>
        {getIcon()}
      </Text>
    </TouchableOpacity>
  );

  if (Platform.OS === 'web' && showTooltip && errorMessage) {
    return (
      <View style={styles.tooltipContainer}>
        {iconElement}
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{errorMessage}</Text>
        </View>
      </View>
    );
  }

  return iconElement;
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 2,
  },
  icon: {
    textAlign: 'center',
  },
  tooltipContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    left: -100,
    right: -100,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    padding: 8,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
}); 