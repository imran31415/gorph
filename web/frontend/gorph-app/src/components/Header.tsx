import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface HeaderProps {
  activeTab: 'yaml' | 'dot' | 'diagram';
  onTabChange: (tab: 'yaml' | 'dot' | 'diagram') => void;
  showTabs: boolean;
}

export default function Header({ activeTab, onTabChange, showTabs }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Gorph</Text>
        <Text style={styles.subtitle}>Infrastructure Visualizer</Text>
      </View>
      
      {showTabs && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'yaml' && styles.activeTab]}
            onPress={() => onTabChange('yaml')}
          >
            <Text style={[styles.tabText, activeTab === 'yaml' && styles.activeTabText]}>
              YAML
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dot' && styles.activeTab]}
            onPress={() => onTabChange('dot')}
          >
            <Text style={[styles.tabText, activeTab === 'dot' && styles.activeTabText]}>
              DOT
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diagram' && styles.activeTab]}
            onPress={() => onTabChange('diagram')}
          >
            <Text style={[styles.tabText, activeTab === 'diagram' && styles.activeTabText]}>
              DIAGRAM
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2563eb',
    paddingTop: 44, // Status bar padding
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1d4ed8',
  },
  tabText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 