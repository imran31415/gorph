import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';

interface DotOutputProps {
  value: string;
  style?: any;
  onTogglePane?: () => void;
  onMinimizePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
}

export default function DotOutput({ value, style, onTogglePane, onMinimizePane, isExpanded, canExpand }: DotOutputProps) {
  const copyToClipboard = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(value);
        Alert.alert('Copied!', 'DOT output copied to clipboard');
      } catch (err) {
        console.error('Failed to copy: ', err);
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    } else {
      // For mobile platforms, you'd need to use a clipboard library
      Alert.alert('Copy', 'Copy functionality requires clipboard library on mobile');
    }
  };

  const lines = value.split('\n');

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>�� DOT Output</Text>
          <Text style={styles.subtitle}>Technical notation - compiled from YAML for GraphViz</Text>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={copyToClipboard}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
          {onMinimizePane && (
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={onMinimizePane}
            >
              <Text style={styles.minimizeButtonText}>−</Text>
            </TouchableOpacity>
          )}
          {canExpand && onTogglePane && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onTogglePane}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? '⤓' : '⤢'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} horizontal showsHorizontalScrollIndicator>
        <ScrollView showsVerticalScrollIndicator>
          <View style={styles.codeContainer}>
            {lines.map((line, index) => (
              <View key={index} style={styles.lineContainer}>
                <Text style={styles.lineNumber}>
                  {String(index + 1).padStart(3, ' ')}
                </Text>
                <Text style={styles.codeLine}>
                  {line || ' '}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  minimizeButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  minimizeButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  expandButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  codeContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  lineContainer: {
    flexDirection: 'row',
    minHeight: 20,
  },
  lineNumber: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#9ca3af',
    marginRight: 12,
    textAlign: 'right',
    minWidth: 40,
  },
  codeLine: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1f2937',
    flex: 1,
  },
}); 