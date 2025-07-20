import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for diagram state management
export interface DiagramChange {
  id: string;
  timestamp: number;
  yamlContent: string;
  changeType: 'manual' | 'template' | 'builder' | 'undo' | 'redo';
  description: string;
  previousContent?: string;
}

export interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  currentYaml: string;
  changeHistory: DiagramChange[];
  currentChangeIndex: number; // For undo/redo
}

export interface DiagramSession {
  diagrams: Record<string, Diagram>;
  activeDiagramId: string | null;
  sessionStartTime: number;
}

interface DiagramContextType {
  // Current state
  session: DiagramSession;
  activeDiagram: Diagram | null;
  canUndo: boolean;
  canRedo: boolean;
  
  // Diagram management
  createNewDiagram: (name?: string, initialYaml?: string) => string;
  switchToDiagram: (diagramId: string) => void;
  renameDiagram: (diagramId: string, newName: string) => void;
  deleteDiagram: (diagramId: string) => void;
  
  // Change management
  updateYaml: (yamlContent: string, changeType: DiagramChange['changeType'], description: string) => void;
  undo: () => void;
  redo: () => void;
  
  // History
  getChangeHistory: (diagramId?: string) => DiagramChange[];
  revertToChange: (changeId: string) => void;
  
  // Persistence
  saveSession: () => Promise<void>;
  loadSession: () => Promise<void>;
}

const DiagramContext = createContext<DiagramContextType | null>(null);

export const useDiagramState = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagramState must be used within a DiagramStateProvider');
  }
  return context;
};

const STORAGE_KEY = 'gorph_diagram_session';

export const DiagramStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DiagramSession>({
    diagrams: {},
    activeDiagramId: null,
    sessionStartTime: Date.now(),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate unique IDs
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate change description
  const generateChangeDescription = (changeType: DiagramChange['changeType'], yamlContent: string): string => {
    const entityCount = (yamlContent.match(/- id:/g) || []).length;
    const connectionCount = (yamlContent.match(/- from:/g) || []).length;
    
    switch (changeType) {
      case 'manual':
        return `Manual edit (${entityCount} entities, ${connectionCount} connections)`;
      case 'template':
        return `Template applied (${entityCount} entities, ${connectionCount} connections)`;
      case 'builder':
        return `Builder modification (${entityCount} entities, ${connectionCount} connections)`;
      case 'undo':
        return 'Undo operation';
      case 'redo':
        return 'Redo operation';
      default:
        return `Update (${entityCount} entities, ${connectionCount} connections)`;
    }
  };

  // Get active diagram
  const activeDiagram = session.activeDiagramId ? session.diagrams[session.activeDiagramId] : null;

  // Check undo/redo availability
  const canUndo = activeDiagram ? activeDiagram.currentChangeIndex > 0 : false;
  const canRedo = activeDiagram ? activeDiagram.currentChangeIndex < activeDiagram.changeHistory.length - 1 : false;

  // Create new diagram
  const createNewDiagram = useCallback((name?: string, initialYaml: string = ''): string => {
    const id = generateId();
    const timestamp = Date.now();
    const diagramName = name || `Diagram ${Object.keys(session.diagrams).length + 1}`;
    
    console.log('Creating new diagram:', {
      name: diagramName,
      currentDiagramCount: Object.keys(session.diagrams).length
    });
    
    const initialChange: DiagramChange = {
      id: generateId(),
      timestamp,
      yamlContent: initialYaml,
      changeType: 'template',
      description: initialYaml ? 'Initial template loaded' : 'New diagram created',
    };

    const newDiagram: Diagram = {
      id,
      name: diagramName,
      createdAt: timestamp,
      lastModified: timestamp,
      currentYaml: initialYaml,
      changeHistory: [initialChange],
      currentChangeIndex: 0,
    };

    setSession(prev => {
      console.log('🆕 DiagramStateManager: Setting new diagram as active:', {
        newDiagramId: id,
        newDiagramName: diagramName,
        previousActiveDiagramId: prev.activeDiagramId,
        previousActiveDiagramName: prev.activeDiagramId ? prev.diagrams[prev.activeDiagramId]?.name : 'None',
        totalDiagrams: Object.keys(prev.diagrams).length + 1,
        willSetActiveTo: id
      });
      
      const newSession = {
        ...prev,
        diagrams: {
          ...prev.diagrams,
          [id]: newDiagram,
        },
        activeDiagramId: id,
      };
      
      console.log('🆕 DiagramStateManager: New session state:', {
        activeDiagramId: newSession.activeDiagramId,
        activeDiagramName: newSession.diagrams[newSession.activeDiagramId]?.name,
        totalDiagrams: Object.keys(newSession.diagrams).length
      });
      
      return newSession;
    });

    return id;
  }, [session.diagrams]);

  // Switch to diagram
  const switchToDiagram = useCallback((diagramId: string) => {
    if (session.diagrams[diagramId]) {
      console.log('🔄 DiagramStateManager: Switching to diagram:', {
        targetDiagramId: diagramId,
        targetDiagramName: session.diagrams[diagramId]?.name,
        currentActiveDiagramId: session.activeDiagramId,
        currentActiveDiagramName: session.activeDiagramId ? session.diagrams[session.activeDiagramId]?.name : 'None'
      });
      
      setSession(prev => {
        const newSession = {
          ...prev,
          activeDiagramId: diagramId,
        };
        
        console.log('🔄 DiagramStateManager: Switch complete - new active diagram:', {
          activeDiagramId: newSession.activeDiagramId,
          activeDiagramName: newSession.diagrams[newSession.activeDiagramId]?.name
        });
        
        return newSession;
      });
    } else {
      console.error('❌ DiagramStateManager: Cannot switch to diagram - not found:', {
        targetDiagramId: diagramId,
        availableDiagrams: Object.keys(session.diagrams),
        availableNames: Object.values(session.diagrams).map(d => d.name)
      });
    }
  }, [session.diagrams]);

  // Rename diagram
  const renameDiagram = useCallback((diagramId: string, newName: string) => {
    setSession(prev => ({
      ...prev,
      diagrams: {
        ...prev.diagrams,
        [diagramId]: {
          ...prev.diagrams[diagramId],
          name: newName,
          lastModified: Date.now(),
        },
      },
    }));
  }, []);

  // Delete diagram
  const deleteDiagram = useCallback((diagramId: string) => {
    setSession(prev => {
      const newDiagrams = { ...prev.diagrams };
      delete newDiagrams[diagramId];
      
      // If deleting active diagram, switch to another or create new
      let newActiveDiagramId = prev.activeDiagramId;
      if (prev.activeDiagramId === diagramId) {
        const remainingIds = Object.keys(newDiagrams);
        newActiveDiagramId = remainingIds.length > 0 ? remainingIds[0] : null;
      }

      return {
        ...prev,
        diagrams: newDiagrams,
        activeDiagramId: newActiveDiagramId,
      };
    });
  }, []);

  // Update YAML with change tracking
  const updateYaml = useCallback((yamlContent: string, changeType: DiagramChange['changeType'], description?: string) => {
    if (!activeDiagram) {
      console.error('Cannot update YAML - no active diagram');
      return;
    }

    const timestamp = Date.now();
    const change: DiagramChange = {
      id: generateId(),
      timestamp,
      yamlContent,
      changeType,
      description: description || generateChangeDescription(changeType, yamlContent),
      previousContent: activeDiagram.currentYaml,
    };

    setSession(prev => {
      const diagram = prev.diagrams[activeDiagram.id];
      
      if (!diagram) {
        console.error('Diagram not found in session');
        return prev;
      }
      
      // Truncate history if we're not at the end (for new changes after undo)
      const newHistory = [...diagram.changeHistory.slice(0, diagram.currentChangeIndex + 1), change];
      
      return {
        ...prev,
        diagrams: {
          ...prev.diagrams,
          [activeDiagram.id]: {
            ...diagram,
            currentYaml: yamlContent,
            lastModified: timestamp,
            changeHistory: newHistory,
            currentChangeIndex: newHistory.length - 1,
          },
        },
      };
    });
  }, [activeDiagram]);

  // Undo
  const undo = useCallback(() => {
    if (!activeDiagram || !canUndo) return;

    const previousIndex = activeDiagram.currentChangeIndex - 1;
    const previousChange = activeDiagram.changeHistory[previousIndex];

    setSession(prev => ({
      ...prev,
      diagrams: {
        ...prev.diagrams,
        [activeDiagram.id]: {
          ...activeDiagram,
          currentYaml: previousChange.yamlContent,
          currentChangeIndex: previousIndex,
          lastModified: Date.now(),
        },
      },
    }));
  }, [activeDiagram, canUndo]);

  // Redo
  const redo = useCallback(() => {
    if (!activeDiagram || !canRedo) return;

    const nextIndex = activeDiagram.currentChangeIndex + 1;
    const nextChange = activeDiagram.changeHistory[nextIndex];

    setSession(prev => ({
      ...prev,
      diagrams: {
        ...prev.diagrams,
        [activeDiagram.id]: {
          ...activeDiagram,
          currentYaml: nextChange.yamlContent,
          currentChangeIndex: nextIndex,
          lastModified: Date.now(),
        },
      },
    }));
  }, [activeDiagram, canRedo]);

  // Get change history
  const getChangeHistory = useCallback((diagramId?: string): DiagramChange[] => {
    const targetId = diagramId || session.activeDiagramId;
    if (!targetId || !session.diagrams[targetId]) return [];
    return session.diagrams[targetId].changeHistory;
  }, [session]);

  // Revert to specific change
  const revertToChange = useCallback((changeId: string) => {
    if (!activeDiagram) return;

    const changeIndex = activeDiagram.changeHistory.findIndex(change => change.id === changeId);
    if (changeIndex === -1) return;

    const targetChange = activeDiagram.changeHistory[changeIndex];

    setSession(prev => ({
      ...prev,
      diagrams: {
        ...prev.diagrams,
        [activeDiagram.id]: {
          ...activeDiagram,
          currentYaml: targetChange.yamlContent,
          currentChangeIndex: changeIndex,
          lastModified: Date.now(),
        },
      },
    }));
  }, [activeDiagram]);

  // Save session to storage
  const saveSession = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [session]);

  // Load session from storage
  const loadSession = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSession: DiagramSession = JSON.parse(stored);
        console.log('Loading session from storage:', {
          diagramCount: Object.keys(parsedSession.diagrams).length,
          activeDiagramId: parsedSession.activeDiagramId
        });
        setSession(parsedSession);
      } else {
        console.log('No stored session found');
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load session:', error);
      setIsLoaded(true);
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSession();
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [session, saveSession]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const contextValue: DiagramContextType = {
    session: isLoaded ? session : { diagrams: {}, activeDiagramId: null, sessionStartTime: 0 },
    activeDiagram,
    canUndo,
    canRedo,
    createNewDiagram,
    switchToDiagram,
    renameDiagram,
    deleteDiagram,
    updateYaml,
    undo,
    redo,
    getChangeHistory,
    revertToChange,
    saveSession,
    loadSession,
  };

  return (
    <DiagramContext.Provider value={contextValue}>
      {children}
    </DiagramContext.Provider>
  );
}; 