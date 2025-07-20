import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function Footer() {
  const handleSourceCodePress = () => {
    Linking.openURL('https://github.com/imran31415/gorph');
  };

  const handleAuthorPress = () => {
    Linking.openURL('https://github.com/imran31415');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Gorph Infrastructure Visualizer</Text>
      <TouchableOpacity style={styles.link} onPress={handleSourceCodePress}>
        <Text style={styles.linkText}>
          Source Code by{' '}
          <Text style={styles.authorLink} onPress={handleAuthorPress}>Imran</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  brand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#6b7280',
  },
  authorLink: {
    fontSize: 12,
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
}); 