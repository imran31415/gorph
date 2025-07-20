import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ValidationIcon from './ValidationIcon';
import { ideTheme } from '../theme/ideTheme';

type ValidationStatus = 'valid' | 'invalid' | 'pending' | 'empty';

interface HeaderProps {
  activeTab: 'yaml' | 'dot' | 'diagram' | 'builder';
  onTabChange: (tab: 'yaml' | 'dot' | 'diagram' | 'builder') => void;
  showTabs: boolean;
  onTemplatePress?: () => void;
  validationStates?: {
    yaml: ValidationStatus;
    dot: ValidationStatus;
    diagram: ValidationStatus;
    builder: ValidationStatus;
  };
  validationErrors?: {
    yaml: string | null;
    dot: string | null;
    diagram: string | null;
    builder: string | null;
  };
}

export default function Header({ 
  activeTab, 
  onTabChange, 
  showTabs, 
  onTemplatePress,
  validationStates, 
  validationErrors 
}: HeaderProps) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Track screen width for responsive layout
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Determine if we should use compact layout for narrow screens
  const isNarrowScreen = screenWidth < 400;
  const isVeryNarrowScreen = screenWidth < 350;
  const handleSourceCodePress = () => {
    Linking.openURL('https://github.com/imran31415/gorph');
  };

  const handleAuthorPress = () => {
    Linking.openURL('https://github.com/imran31415');
  };

  return (
    <View style={styles.container}>
      {showTabs && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'yaml' && styles.activeTab]}
            onPress={() => onTabChange('yaml')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabText, 
                activeTab === 'yaml' && styles.activeTabText,
                isNarrowScreen && styles.tabTextNarrow,
                isVeryNarrowScreen && styles.tabTextVeryNarrow
              ]}>
                YAML
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.yaml}
                  errorMessage={validationErrors?.yaml}
                  size={isVeryNarrowScreen ? 10 : 14}
                />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dot' && styles.activeTab]}
            onPress={() => onTabChange('dot')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabText, 
                activeTab === 'dot' && styles.activeTabText,
                isNarrowScreen && styles.tabTextNarrow,
                isVeryNarrowScreen && styles.tabTextVeryNarrow
              ]}>
                DOT
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.dot}
                  errorMessage={validationErrors?.dot}
                  size={isVeryNarrowScreen ? 10 : 14}
                />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diagram' && styles.activeTab]}
            onPress={() => onTabChange('diagram')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabText, 
                activeTab === 'diagram' && styles.activeTabText,
                isNarrowScreen && styles.tabTextNarrow,
                isVeryNarrowScreen && styles.tabTextVeryNarrow
              ]}>
                DIAGRAM
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.diagram}
                  errorMessage={validationErrors?.diagram}
                  size={isVeryNarrowScreen ? 10 : 14}
                />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'builder' && styles.activeTab]}
            onPress={() => onTabChange('builder')}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabText, 
                activeTab === 'builder' && styles.activeTabText,
                isNarrowScreen && styles.tabTextNarrow,
                isVeryNarrowScreen && styles.tabTextVeryNarrow
              ]}>
                BUILDER
              </Text>
              {validationStates && (
                <ValidationIcon
                  status={validationStates.builder}
                  errorMessage={validationErrors?.builder}
                  size={isVeryNarrowScreen ? 10 : 14}
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
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTab: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    color: '#64748b',
    fontSize: ideTheme.typography.small.fontSize + 1,
    fontWeight: '600',
    fontFamily: ideTheme.fonts.system,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: ideTheme.fonts.system,
    letterSpacing: 0.5,
  },
  tabTextNarrow: {
    fontSize: ideTheme.typography.small.fontSize - 1,
    letterSpacing: 0.3,
  },
  tabTextVeryNarrow: {
    fontSize: ideTheme.typography.small.fontSize - 2,
    letterSpacing: 0.2,
  },
}); 