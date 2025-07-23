import React, { useState, useEffect } from 'react';
import { TreePine, Users, Search, Filter, ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Calendar, Phone, FileText, Edit3, Trash2, Maximize, Minimize, Heart } from 'lucide-react';
import Tree from 'react-d3-tree';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService, DeletionConstraintError } from '../services/supabase';
import { arabicFamilyService, PersonWithDetails } from '../services/arabicFamilyService';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import ResponsiveFlex from './responsive/ResponsiveFlex';
import ResponsiveText from './responsive/ResponsiveText';
import PersonForm from './DataEntry/PersonForm';

interface FamilyTreeProps {
  refreshTrigger: number;
}

interface TreeNode {
  name: string;
  attributes?: {
    id: string;
    fullName?: string;
    birthDate?: string;
    deathDate?: string;
    gender?: string;
    nationalId?: string;
    level: number;
    isAlive: boolean;
    nodeColor?: string;
    phone?: string;
    notes?: string;
  };
  children?: TreeNode[];
}

export default function FamilyTree({ refreshTrigger }: FamilyTreeProps) {
  const [members, setMembers] = useState<FamilyMemberWithLevel[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [treeOrientation, setTreeOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [editingPersonData, setEditingPersonData] = useState<PersonWithDetails | null>(null);

  useEffect(() => {
    loadFamilyTree();
  }, [refreshTrigger]);

  useEffect(() => {
    if (members.length > 0) {
      const filteredMembers = filterMembers(members);
      const tree = buildTreeStructure(filteredMembers);
      setTreeData(tree);
    }
  }, [members, searchTerm, selectedLevel]);

  // Set initial translate position when component mounts
  useEffect(() => {
    const container = document.querySelector('.tree-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setTranslate({
        x: rect.width / 2,
        y: treeOrientation === 'vertical' ? 100 : rect.height / 2
      });
    }
  }, [treeOrientation]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const loadFamilyTree = async () => {
    setLoading(true);
    try {
      const data = await familyService.getFamilyTree();
      setMembers(data);
    } catch (error) {
      console.error('Error loading family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = (allMembers: FamilyMemberWithLevel[]) => {
    return allMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevel === null || member.level === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  };

  const buildTreeStructure = (flatMembers: FamilyMemberWithLevel[]): TreeNode[] => {
    const memberMap = new Map<string, FamilyMemberWithLevel>();
    const childrenMap = new Map<string, FamilyMemberWithLevel[]>();

    // Create maps for quick lookup
    flatMembers.forEach(member => {
      memberMap.set(member.id, member);
      if (member.parent_id) {
        if (!childrenMap.has(member.parent_id)) {
          childrenMap.set(member.parent_id, []);
        }
        childrenMap.get(member.parent_id)!.push(member);
      }
    });

    // Find root members (those without parents)
    const rootMembers = flatMembers.filter(member => !member.parent_id);

    // Build tree recursively
    const buildNode = (member: FamilyMemberWithLevel, parentColor?: string): TreeNode => {
      const children = childrenMap.get(member.id) || [];
      const hasChildren = children.length > 0;
      const level = member.level;
      
      // Get node color based on generation level and whether it has children
      const getNodeColor = (level: number, hasChildren: boolean, isAlive: boolean) => {
        if (!isAlive) return '#6b7280'; // Gray for deceased
        if (!hasChildren) return '#3b82f6'; // Blue for leaf nodes (no children) that are alive
        
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
        return colors[level % colors.length];
      };
      
      const nodeColor = getNodeColor(level, hasChildren, member.is_alive !== false);
      
      return {
        name: member.name.split(' ')[0], // Only display first name
        attributes: {
          id: member.id,
          fullName: member.name, // Store full name for details
          birthDate: member.birth_date || undefined,
          deathDate: member.date_of_death || undefined,
          gender: member.gender || undefined,
          nationalId: member.phone || undefined,
          level: member.level,
          isAlive: member.is_alive !== false,
          nodeColor: nodeColor,
          phone: member.phone || undefined,
          notes: member.notes || undefined
        },
        children: children.length > 0 ? children.map(child => buildNode(child, nodeColor)) : undefined
      };
    };

    return rootMembers.map(buildNode);
  };

  const handleEdit = async (memberId: string) => {
    try {
      // Find the member in the current members list
      const member = members.find(m => m.id === memberId);
      if (!member) {
        showMessage('لم يتم العثور على بيانات العضو', 'error');
        return;
      }

      // Get detailed person data from Arabic family service
      const personsData = await arabicFamilyService.getPersonsWithDetails();
      const personDetails = personsData.find(p => p.id === parseInt(memberId));
      
      if (!personDetails) {
        showMessage('لم يتم العثور على تفاصيل العضو', 'error');
        return;
      }

      setEditingPersonId(parseInt(memberId));
      setEditingPersonData(personDetails);
      setSelectedNode(null); // Close details modal
    } catch (error) {
      console.error('Error loading person for edit:', error);
      showMessage('حدث خطأ أثناء تحميل بيانات العضو', 'error');
    }
  };

  const handleEditComplete = () => {
    setEditingPersonId(null);
    setEditingPersonData(null);
    loadFamilyTree(); // Refresh the tree data
    showMessage('تم تحديث بيانات العضو بنجاح!', 'success');
  };

  const handleEditCancel = () => {
    setEditingPersonId(null);
    setEditingPersonData(null);
  };

  const toggleFullScreen = async () => {
    const treeContainer = document.getElementById('tree-container');
    if (!treeContainer) return;

    try {
      if (!document.fullscreenElement) {
        await treeContainer.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    const messageDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    messageDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md`;
    messageDiv.style.direction = 'rtl';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
  };

  const handleDelete = async (memberId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
      try {
        await familyService.deleteMember(memberId);
        loadFamilyTree();
        showMessage('تم حذف العضو بنجاح!', 'success');
      } catch (error) {
        console.error('Error deleting member:', error);
        
        if (error instanceof DeletionConstraintError) {
          showMessage(error.message, 'warning');
        } else {
          showMessage('حدث خطأ أثناء حذف العضو. يرجى المحاولة مرة أخرى.', 'error');
        }
      }
    }
  };

  const uniqueLevels = [...new Set(members.map(m => m.level))].sort((a, b) => a - b);

  const getLevelTitle = (level: number) => {
    const titles = [
      'الأجداد والجذور',
      'الآباء والأمهات',
      'الأبناء والبنات',
      'الأحفاد',
      'أبناء الأحفاد',
      'الجيل السادس'
    ];
    return titles[level] || `الجيل ${level + 1}`;
  };

  // Custom node rendering
  const renderCustomNode = ({ nodeDatum, toggleNode, hierarchyPointNode }: any) => {
    const isAlive = nodeDatum.attributes?.isAlive !== false;
    const level = nodeDatum.attributes?.level || 0;
    const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
    const childrenCount = nodeDatum.children ? nodeDatum.children.length : 0;
    const nodeColor = nodeDatum.attributes?.nodeColor || '#6b7280';
    
    // Truncate name if too long
    const displayName = nodeDatum.name.length > 10 ? nodeDatum.name.substring(0, 10) + '...' : nodeDatum.name;
    
    // Split name into multiple lines if needed
    const nameWords = displayName.split(' ');
    const firstLine = nameWords[0] || '';
    const secondLine = nameWords.slice(1).join(' ');
    
    return (
      <g>
        {/* Node circle */}
        <circle
          r={30}
          fill={nodeColor}
          stroke={isAlive ? '#ffffff' : '#9ca3af'}
          strokeWidth={3}
          onClick={toggleNode}
          style={{ cursor: 'pointer' }}
          opacity={isAlive ? 1 : 0.7}
        />
        
        {/* Status indicator - only for living individuals */}
        {isAlive && (
          <circle
            r={5}
            cx={20}
            cy={-20}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={2}
          />
        )}
        
        {/* Name text - First line */}
        <text
          fill="#ffffff"
          strokeWidth="0"
          x={0}
          y={secondLine ? -2 : 3}
          textAnchor="middle"
          fontSize="10"
          fontWeight={hasChildren ? "bold" : "bold"}
          style={{ pointerEvents: 'none' }}
        >
          {firstLine}
        </text>
        
        {/* Name text - Second line */}
        {secondLine && (
          <text
            fill="#ffffff"
            strokeWidth="0"
            x={0}
            y={8}
            textAnchor="middle"
            fontSize="9"
            fontWeight={hasChildren ? "bold" : "bold"}
            style={{ pointerEvents: 'none' }}
          >
            {secondLine}
          </text>
        )}
        
        {/* Level indicator */}
        <text
          fill="#ffffff"
          strokeWidth="0"
          x={0}
          y={-40}
          textAnchor="middle"
          fontSize="8"
          fontWeight="normal"
          style={{ pointerEvents: 'none' }}
        >
          الجيل {level + 1}
        </text>
        
        {/* Children count indicator */}
        {hasChildren && (
          <g>
            <circle
              r={7}
              cx={0}
              cy={40}
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <text
              fill="#ffffff"
              strokeWidth="0"
              x={0}
              y={44}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {childrenCount}
            </text>
          </g>
        )}
        
        {/* Details button */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            handleNodeClick(nodeDatum);
          }}
          style={{ cursor: 'pointer' }}
          className="info-button-group"
        >
          <circle
            r={8}
            cx={-20}
            cy={-20}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={3}
            opacity={1}
            className="info-button-circle"
          />
          <text
            fill="#ffffff"
            strokeWidth="0"
            x={-20}
            y={-16}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
            className="info-button-text"
          >
            ℹ
          </text>
        </g>
      </g>
    );
  };

  // Handle tree node toggle for zoom effect
  const handleTreeToggle = (nodeDatum: any) => {
    // Check if node is being expanded using the internal react-d3-tree state
    if (nodeDatum.children && nodeDatum.children.length > 0 && !nodeDatum.__rd3t.collapsed) {
      // Zoom in when expanding
      setZoom(prev => Math.min(prev * 1.3, 3));
    }
  };

  // Custom path function to match line color with parent node
  const customPathFunc = (linkDatum: any, orientation: string) => {
    const { source, target } = linkDatum;
    const parentColor = source.data.attributes?.nodeColor || '#10b981';
    
    // Set the stroke color for this specific link
    if (linkDatum.__linkElement) {
      linkDatum.__linkElement.style.stroke = parentColor;
    }
    
    // Return the default diagonal path
    if (orientation === 'horizontal') {
      return `M${source.y},${source.x}C${(source.y + target.y) / 2},${source.x} ${(source.y + target.y) / 2},${target.x} ${target.y},${target.x}`;
    } else {
      return `M${source.x},${source.y}C${source.x},${(source.y + target.y) / 2} ${target.x},${(source.y + target.y) / 2} ${target.x},${target.y}`;
    }
  };

  // Handle node click for details
  const handleNodeClick = (nodeDatum: any) => {
    setSelectedNode(nodeDatum);
  };

  // Tree controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    const container = document.querySelector('.tree-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setTranslate({
        x: rect.width / 2,
        y: treeOrientation === 'vertical' ? 100 : rect.height / 2
      });
    }
  };

  if (loading) {
    return (
      <ResponsiveContainer>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-base sm:text-lg font-medium text-gray-600">جاري تحميل شجرة آل عمير...</span>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <ResponsiveFlex gap="sm" className="mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl">
              <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <ResponsiveText as="h2" size="xl" weight="bold" color="gray-800">
                شجرة آل عمير التفاعلية
              </ResponsiveText>
              <ResponsiveText size="sm" color="gray-600">
                عدد الأعضاء: {members.length}
              </ResponsiveText>
            </div>
          </ResponsiveFlex>

          {/* Controls */}
          <ResponsiveFlex 
            direction={{ xs: 'col', md: 'row' }} 
            gap="md" 
            className="mb-4"
          >
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="البحث عن عضو في آل عمير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm sm:text-base"
              />
            </div>
            
            {/* Level Filter */}
            <div className="relative min-w-[10rem]">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={selectedLevel ?? ''}
                onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full pr-10 pl-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm sm:text-base"
              >
                <option value="">جميع الأجيال</option>
                {uniqueLevels.map(level => (
                  <option key={level} value={level}>
                    {getLevelTitle(level)}
                  </option>
                ))}
              </select>
            </div>
          </ResponsiveFlex>

          {/* Tree Controls */}
          <ResponsiveFlex gap="sm" className="flex-wrap">
            <button
              onClick={() => setTreeOrientation(treeOrientation === 'vertical' ? 'horizontal' : 'vertical')}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              {treeOrientation === 'vertical' ? 'عرض أفقي' : 'عرض عمودي'}
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="إعادة تعيين العرض"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title={isFullScreen ? "إغلاق الشاشة الكاملة" : "عرض بالشاشة الكاملة"}
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </ResponsiveFlex>
        </div>

        {/* Tree Visualization */}
        {treeData.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <TreePine className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <ResponsiveText as="h3" size="xl" weight="semibold" color="gray-600" className="mb-2">
              لا توجد أعضاء
            </ResponsiveText>
            <ResponsiveText size="base" color="gray-500">
              ابدأ بإضافة أعضاء جدد لبناء شجرة آل عمير
            </ResponsiveText>
          </div>
        ) : (
          <div className="relative">
            <div 
              id="tree-container"
              className="tree-container w-full bg-gradient-to-br from-emerald-50 to-blue-50" 
              style={{ 
                height: isFullScreen ? '100vh' : '600px', 
                direction: 'ltr',
                width: isFullScreen ? '100vw' : '100%'
              }}
            >
              <Tree
                data={treeData}
                orientation={treeOrientation}
                translate={translate}
                zoom={zoom}
                scaleExtent={{ min: 0.3, max: 3 }}
                separation={{ siblings: 0.8, nonSiblings: 1.0 }}
                nodeSize={{ x: 150, y: 120 }}
                renderCustomNodeElement={renderCustomNode}
                onNodeClick={handleNodeClick}
                onNodeToggle={handleTreeToggle}
                pathFunc={customPathFunc}
                transitionDuration={500}
                collapsible={true}
                initialDepth={0}
                depthFactor={120}
                shouldCollapseNeighborNodes={false}
                styles={{
                  links: {
                    stroke: '#10b981',
                    strokeWidth: 2,
                  },
                  nodes: {
                    node: {
                      circle: {
                        fill: '#10b981',
                        stroke: '#ffffff',
                        strokeWidth: 3,
                      },
                      name: {
                        stroke: 'none',
                        fill: '#374151',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      },
                    },
                    leafNode: {
                      circle: {
                        fill: '#3b82f6',
                        stroke: '#ffffff',
                        strokeWidth: 3,
                      },
                      name: {
                        stroke: 'none',
                        fill: '#374151',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      },
                    },
                  },
                }}
              />
              
              {/* Enhanced CSS for info button hover effects */}
              <style jsx>{`
                .info-button-group:hover .info-button-circle {
                  transform: scale(1.15);
                  filter: brightness(1.1);
                  stroke-width: 4;
                }
                
                .info-button-group:hover .info-button-text {
                  font-size: 11px;
                  font-weight: 900;
                }
                
                .info-button-group {
                  transition: all 0.2s ease;
                }
                
                .info-button-circle {
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                }
                
                .info-button-text {
                  transition: all 0.2s ease;
                }
              `}</style>
            </div>

            {/* Zoom indicator */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
              <span className="text-sm font-medium text-gray-700">
                التكبير: {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Fullscreen indicator */}
            {isFullScreen && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                <span className="text-sm font-medium text-gray-700">
                  وضع الشاشة الكاملة
                </span>
              </div>
            )}
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-6 text-white relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedNode.attributes?.fullName || selectedNode.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        الجيل {(selectedNode.attributes?.level || 0) + 1}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedNode.attributes?.isAlive 
                          ? 'bg-green-500/20 backdrop-blur-sm' 
                          : 'bg-gray-500/20 backdrop-blur-sm'
                      }`}>
                        {selectedNode.attributes?.isAlive ? 'على قيد الحياة' : 'متوفى'}
                      </span>
                      {selectedNode.attributes?.gender && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedNode.attributes.gender === 'ذكر'
                            ? 'bg-blue-500/20 backdrop-blur-sm'
                            : 'bg-pink-500/20 backdrop-blur-sm'
                        }`}>
                          {selectedNode.attributes.gender}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors absolute top-4 right-4"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedNode.attributes?.birthDate && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="block text-sm text-blue-600 font-medium">تاريخ الميلاد</span>
                        <span className="block text-sm text-gray-800 font-semibold">
                          {new Date(selectedNode.attributes.birthDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedNode.attributes?.deathDate && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <span className="block text-sm text-gray-600 font-medium">تاريخ الوفاة</span>
                        <span className="block text-sm text-gray-800 font-semibold">
                          {new Date(selectedNode.attributes.deathDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedNode.attributes?.phone && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="block text-sm text-emerald-600 font-medium">الهاتف</span>
                        <span className="block text-sm text-gray-800 font-semibold font-mono" dir="ltr">
                          {selectedNode.attributes.phone}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedNode.children && selectedNode.children.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div>
                        <span className="block text-sm text-amber-600 font-medium">عدد الأطفال</span>
                        <span className="block text-sm text-gray-800 font-semibold">{selectedNode.children.length}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedNode.attributes?.notes && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <span className="block text-sm font-medium text-amber-800 mb-2">ملاحظات</span>
                        <p className="text-amber-700 leading-relaxed">{selectedNode.attributes.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => handleEdit(selectedNode.attributes?.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNode.attributes?.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-3">دليل الألوان والرموز:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span>الجيل الأول</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>الجيل الثاني</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span>الجيل الثالث</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>الجيل الرابع</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span>متوفى</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>على قيد الحياة (بدون أطفال)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>مؤشر الحياة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">3</div>
              <span>عدد الأطفال</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">ℹ</div>
              <span>زر التفاصيل</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">انقر على العقدة للتوسيع/الطي، أو على زر التفاصيل (ℹ) لعرض المعلومات والتعديل.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Person Modal */}
      {editingPersonId && editingPersonData && (
        <PersonForm
          onSuccess={handleEditComplete}
          onCancel={handleEditCancel}
          editData={editingPersonData}
        />
      )}
    </ResponsiveContainer>
  );
}