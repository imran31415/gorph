import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ValidationIcon from './ValidationIcon';

type ValidationStatus = 'valid' | 'invalid' | 'pending' | 'empty';

interface HeaderProps {
  activeTab: 'yaml' | 'dot' | 'diagram';
  onTabChange: (tab: 'yaml' | 'dot' | 'diagram') => void;
  showTabs: boolean;
  validationStates?: {
    yaml: ValidationStatus;
    dot: ValidationStatus;
    diagram: ValidationStatus;
  };
  validationErrors?: {
    yaml: string | null;
    dot: string | null;
    diagram: string | null;
  };
}

export default function Header({ activeTab, onTabChange, showTabs, validationStates, validationErrors }: HeaderProps) {
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
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === 'yaml' && styles.activeTabText]}>
                YAML
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.yaml}
                  errorMessage={validationErrors?.yaml}
                  size={14}
                />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dot' && styles.activeTab]}
            onPress={() => onTabChange('dot')}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === 'dot' && styles.activeTabText]}>
                DOT
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.dot}
                  errorMessage={validationErrors?.dot}
                  size={14}
                />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diagram' && styles.activeTab]}
            onPress={() => onTabChange('diagram')}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === 'diagram' && styles.activeTabText]}>
                DIAGRAM
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.diagram}
                  errorMessage={validationErrors?.diagram}
                  size={14}
                />
              )}
            </View>
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
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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