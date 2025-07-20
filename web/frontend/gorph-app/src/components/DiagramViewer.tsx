import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { ideTheme } from '../theme/ideTheme';

interface DiagramViewerProps {
  svg: string | null;
  dotContent: string;
  yamlContent?: string;
  style?: any;
  onTogglePane?: () => void;
  onMinimizePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
  diagramHeight?: number;
  onHeightChange?: (height: number) => void;
}

interface SvgRendererProps {
  svgContent: string;
  zoom: number;
}

// Web-specific SVG renderer component
function SvgRenderer({ svgContent, zoom }: SvgRendererProps) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && Platform.OS === 'web') {
      // @ts-ignore - we know this is web and containerRef.current is a DOM element
      containerRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        minHeight: '300px'
      }}
    />
  );
}

// Mobile SVG renderer using WebView
function MobileSvgRenderer({ svgContent }: { svgContent: string }) {
  if (Platform.OS === 'web') {
    return null;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #ffffff;
          }
          svg {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={{ flex: 1, minHeight: 400 }}
      scalesPageToFit={true}
      startInLoadingState={true}
      javaScriptEnabled={false}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
}

export default function DiagramViewer({ svg, dotContent, yamlContent, style, onTogglePane, onMinimizePane, isExpanded, canExpand, diagramHeight = 390, onHeightChange }: DiagramViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.2));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // Try to render DOT content using QuickChart GraphViz API
  const renderDotWithAPI = async (dotCode: string) => {
    if (Platform.OS !== 'web') return;
    
    setIsRendering(true);
    setRenderError('');
    
    try {
      console.log('Rendering DOT with QuickChart API...');
      
      // Use QuickChart GraphViz API
      const response = await fetch('https://quickchart.io/graphviz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph: dotCode,
          format: 'svg'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const svg = await response.text();
      console.log('SVG generated successfully');
      setRenderedSvg(svg);
      setIsRendering(false);
      
    } catch (error) {
      console.error('API rendering failed:', error);
      setRenderError(error instanceof Error ? error.message : 'API rendering failed');
      setIsRendering(false);
    }
  };

  // Try to render when dotContent changes
  useEffect(() => {
    if (dotContent && Platform.OS === 'web') {
      renderDotWithAPI(dotContent);
    }
  }, [dotContent]);

  const downloadSVG = () => {
    if (Platform.OS === 'web' && svg) {
      try {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'infrastructure-diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Downloaded!', 'SVG diagram has been downloaded');
      } catch (err) {
        console.error('Failed to download: ', err);
        Alert.alert('Error', 'Failed to download SVG');
      }
    } else {
      Alert.alert('Download', 'Download functionality is available on web only');
    }
  };

  const exportAsImage = async () => {
    try {
      if (Platform.OS === 'web' && renderedSvg) {
        // Create a temporary link to download the SVG
        const svgBlob = new Blob([renderedSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'infrastructure-diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Diagram exported as SVG file');
      } else {
        Alert.alert('Export Not Available', 'Image export is only available on web platform with rendered diagrams');
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export diagram image');
    }
  };

  const exportAsYaml = async () => {
    try {
      if (Platform.OS === 'web') {
        // Get YAML content from props
        const yaml = getYamlContent();
        if (yaml) {
          const yamlBlob = new Blob([yaml], { type: 'text/yaml' });
          const url = URL.createObjectURL(yamlBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'infrastructure.yaml';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert('Success', 'YAML configuration exported');
        } else {
          Alert.alert('Export Error', 'No YAML content available to export');
        }
      } else {
        Alert.alert('Export Not Available', 'File export is only available on web platform');
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export YAML file');
    }
  };

  const exportAsDot = async () => {
    try {
      if (Platform.OS === 'web' && dotContent) {
        const dotBlob = new Blob([dotContent], { type: 'text/plain' });
        const url = URL.createObjectURL(dotBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'infrastructure.dot';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'DOT notation exported');
      } else {
        Alert.alert('Export Error', 'No DOT content available to export');
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export DOT file');
    }
  };

  const getYamlContent = () => {
    return yamlContent;
  };

  // Show loading state while rendering
  if (isRendering) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
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
        
        {/* Controls Row for loading state */}
        <View style={styles.controlsRow}>
          <Text style={styles.statusText}>Rendering...</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Generating diagram...</Text>
          <Text style={styles.emptySubtext}>
            Please wait while we render your infrastructure diagram
          </Text>
        </View>
      </View>
    );
  }

  // Show rendered SVG if available
  if (renderedSvg && Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
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
        
        {/* Controls Row */}
        <View style={styles.controlsRow}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomReset}>
              <Text style={styles.zoomButtonText}>{Math.round(zoom * 100)}%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          {/* Height Controls */}
          {onHeightChange && (
            <View style={styles.heightControls}>
              <TouchableOpacity
                style={styles.heightButton}
                onPress={() => {
                  const newHeight = Math.max(200, diagramHeight - 50);
                  onHeightChange(newHeight);
                }}
              >
                <Text style={styles.heightButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heightPreset}
                onLongPress={() => {
                  // Show preset options on long press
                  Alert.alert(
                    'Diagram Height Presets',
                    'Choose a preset height:',
                    [
                      { text: 'Small (250px)', onPress: () => onHeightChange(250) },
                      { text: 'Medium (350px)', onPress: () => onHeightChange(350) },
                      { text: 'Large (500px)', onPress: () => onHeightChange(500) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                onPress={() => onHeightChange(300)} // Reset to default
              >
                <Text style={styles.heightLabel}>{diagramHeight}px</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heightButton}
                onPress={() => {
                  const newHeight = Math.min(800, diagramHeight + 50);
                  onHeightChange(newHeight);
                }}
              >
                <Text style={styles.heightButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Export Button */}
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} maximumZoomScale={3} minimumZoomScale={0.2}>
          <SvgRenderer svgContent={renderedSvg} zoom={zoom} />
        </ScrollView>
      </View>
    );
  }

  if (!dotContent || dotContent.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
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
        
        {/* Controls Row for empty state */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No diagram to display</Text>
          <Text style={styles.emptySubtext}>
            Enter YAML infrastructure definition to see the diagram
          </Text>
        </View>
      </View>
    );
  }

  // Show render error if there was one
  if (renderError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
            <Text style={[styles.statusText, { color: '#dc2626' }]}>Render Error</Text>
            
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
        
        {/* Controls Row for error state */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to render diagram</Text>
          <Text style={styles.emptySubtext}>
            {renderError}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => dotContent && renderDotWithAPI(dotContent)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // For web platform, show instructions since WebView doesn't work
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
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
        
        {/* Controls Row for web instructions */}
        <View style={styles.controlsRow}>
          <Text style={styles.statusText}>DOT Ready for Visualization</Text>
        </View>

        <ScrollView style={styles.instructionsContainer}>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>📊 Visualize Your Infrastructure</Text>
            <Text style={styles.instructionText}>
              Your DOT notation is ready! Choose your preferred method to create the visual diagram:
            </Text>
            
            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>🌐 Online (Recommended):</Text>
              <Text style={styles.methodStep}>1. Copy the DOT output from the middle pane</Text>
              <Text style={styles.methodStep}>2. Visit: dreampuf.github.io/GraphvizOnline</Text>
              <Text style={styles.methodStep}>3. Paste your DOT code and click "Generate Graph!"</Text>
              <Text style={styles.methodStep}>4. Download as PNG, SVG, or PDF</Text>
            </View>

            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>💻 Command Line:</Text>
              <Text style={styles.methodStep}>1. Copy DOT output and save as 'diagram.dot'</Text>
              <Text style={styles.methodStep}>2. Install Graphviz: brew install graphviz</Text>
              <Text style={styles.methodStep}>3. Run: dot -Tpng diagram.dot -o diagram.png</Text>
              <Text style={styles.methodStep}>4. Open diagram.png to view your infrastructure</Text>
            </View>

            <View style={styles.methodContainer}>
              <Text style={styles.methodTitle}>🛠️ Gorph CLI:</Text>
              <Text style={styles.methodStep}>1. Save your YAML as 'infrastructure.yml'</Text>
              <Text style={styles.methodStep}>2. Run: ./gorph -input infrastructure.yml -png diagram.png</Text>
              <Text style={styles.methodStep}>3. Get instant PNG diagrams with styling!</Text>
            </View>

            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>💡 Pro Tip:</Text>
              <Text style={styles.tipText}>
                The Gorph CLI tool (make run-cli) generates both DOT and PNG files automatically
                with the same styling rules used in this web interface.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile: Show SVG using WebView if available
  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>📊 Diagram</Text>
            <Text style={styles.subtitle}>Visual output - automatically generated from YAML</Text>
          </View>
          <View style={styles.headerControls}>
            {canExpand && onTogglePane && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={onTogglePane}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? '-' : '+'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {svg ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={3}
            minimumZoomScale={0.2}
            showsHorizontalScrollIndicator
            showsVerticalScrollIndicator
          >
            <MobileSvgRenderer svgContent={svg} />
          </ScrollView>
        ) : (
          <View style={styles.mobileEmptyContainer}>
            <Text style={styles.emptyText}>📊 Generating diagram...</Text>
            <Text style={styles.emptySubtext}>
              {dotContent ? 'Processing your infrastructure diagram' : 'Enter YAML to see your diagram'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModal}>
            <Text style={styles.exportModalTitle}>📤 Export Options</Text>
            <Text style={styles.exportModalSubtitle}>
              Choose what you'd like to export:
            </Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  setShowExportModal(false);
                  exportAsImage();
                }}
              >
                <Text style={styles.exportOptionIcon}>🖼️</Text>
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>Diagram Image</Text>
                  <Text style={styles.exportOptionDescription}>
                    Download the visual diagram as SVG file
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  setShowExportModal(false);
                  exportAsYaml();
                }}
              >
                <Text style={styles.exportOptionIcon}>📝</Text>
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>YAML Configuration</Text>
                  <Text style={styles.exportOptionDescription}>
                    Download the infrastructure config as YAML file
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => {
                  setShowExportModal(false);
                  exportAsDot();
                }}
              >
                <Text style={styles.exportOptionIcon}>⚙️</Text>
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>DOT Notation</Text>
                  <Text style={styles.exportOptionDescription}>
                    Download the GraphViz DOT source code
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.exportModalCloseButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.exportModalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ideTheme.spacing.lg,
    paddingVertical: ideTheme.spacing.md,
    backgroundColor: ideTheme.colors.light.sidebarBackground,
    borderBottomWidth: 1,
    borderBottomColor: ideTheme.colors.light.border,
    gap: ideTheme.spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 4,
    gap: 8,
    marginLeft: 8,
  },
  heightButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  heightButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  heightLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'center',
  },
  heightPreset: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  statusText: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoomButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  zoomButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionContent: {
    padding: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  methodContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  methodStep: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
    paddingLeft: 8,
    lineHeight: 18,
  },
  tipContainer: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  mobileEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  exportButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  exportModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  exportModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  exportOptions: {
    width: '100%',
    marginBottom: 24,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exportOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  exportOptionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  exportModalCloseButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  exportModalCloseButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
}); 