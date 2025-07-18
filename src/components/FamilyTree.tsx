import React, { useState, useEffect } from 'react';
import { TreePine, Users, Search, Filter, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import Tree from 'react-d3-tree';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService, DeletionConstraintError } from '../services/supabase';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import ResponsiveFlex from './responsive/ResponsiveFlex';
import ResponsiveText from './responsive/ResponsiveText';

interface FamilyTreeProps {
  refreshTrigger: number;
}

interface TreeNode {
  name: string;
  attributes?: {
    id: string;
    birthDate?: string;
    deathDate?: string;
    gender?: string;
    nationalId?: string;
    level: number;
    isAlive: boolean;
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
    const buildNode = (member: FamilyMemberWithLevel): TreeNode => {
      const children = childrenMap.get(member.id) || [];
      
      return {
        name: member.name,
        attributes: {
          id: member.id,
          birthDate: member.birth_date || undefined,
          deathDate: member.date_of_death || undefined,
          gender: member.gender || undefined,
          nationalId: member.phone || undefined, // Using phone as additional info
          level: member.level,
          isAlive: member.is_alive !== false,
          phone: member.phone || undefined,
          notes: member.notes || undefined
        },
        children: children.length > 0 ? children.map(buildNode) : undefined
      };
    };

    return rootMembers.map(buildNode);
  };

  const handleEdit = (memberId: string) => {
    alert(`تعديل العضو: ${memberId}`);
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
  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    const isAlive = nodeDatum.attributes?.isAlive !== false;
    const level = nodeDatum.attributes?.level || 0;
    
    // Color based on generation level
    const getNodeColor = (level: number) => {
      const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
      return colors[level % colors.length];
    };

    const nodeColor = getNodeColor(level);
    
    return (
      <g>
        {/* Node circle */}
        <circle
          r={25}
          fill={isAlive ? nodeColor : '#6b7280'}
          stroke={isAlive ? '#ffffff' : '#9ca3af'}
          strokeWidth={3}
          onClick={toggleNode}
          style={{ cursor: 'pointer' }}
          opacity={isAlive ? 1 : 0.7}
        />
        
        {/* Status indicator */}
        <circle
          r={6}
          cx={18}
          cy={-18}
          fill={isAlive ? '#10b981' : '#ef4444'}
          stroke="#ffffff"
          strokeWidth={2}
        />
        
        {/* Name text */}
        <text
          fill="#ffffff"
          strokeWidth="0"
          x={0}
          y={5}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {nodeDatum.name.length > 15 ? nodeDatum.name.substring(0, 15) + '...' : nodeDatum.name}
        </text>
        
        {/* Level indicator */}
        <text
          fill="#ffffff"
          strokeWidth="0"
          x={0}
          y={-35}
          textAnchor="middle"
          fontSize="10"
          style={{ pointerEvents: 'none' }}
        >
          الجيل {level + 1}
        </text>
        
        {/* Children count indicator */}
        {nodeDatum.children && nodeDatum.children.length > 0 && (
          <g>
            <circle
              r={8}
              cx={0}
              cy={35}
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <text
              fill="#ffffff"
              strokeWidth="0"
              x={0}
              y={40}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {nodeDatum.children.length}
            </text>
          </g>
        )}
      </g>
    );
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
              className="tree-container w-full bg-gradient-to-br from-emerald-50 to-blue-50" 
              style={{ height: '600px', direction: 'ltr' }}
            >
              <Tree
                data={treeData}
                orientation={treeOrientation}
                translate={translate}
                zoom={zoom}
                scaleExtent={{ min: 0.3, max: 3 }}
                separation={{ siblings: 1.5, nonSiblings: 2 }}
                nodeSize={{ x: 200, y: 150 }}
                renderCustomNodeElement={renderCustomNode}
                onNodeClick={handleNodeClick}
                pathFunc="diagonal"
                transitionDuration={500}
                enableLegacyTransitions={true}
                collapsible={true}
                initialDepth={2}
                depthFactor={150}
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
            </div>

            {/* Zoom indicator */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
              <span className="text-sm font-medium text-gray-700">
                التكبير: {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedNode.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    الجيل {(selectedNode.attributes?.level || 0) + 1}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedNode.attributes?.isAlive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedNode.attributes?.isAlive ? 'على قيد الحياة' : 'متوفى'}
                  </span>
                  {selectedNode.attributes?.gender && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedNode.attributes.gender === 'ذكر'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {selectedNode.attributes.gender}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedNode.attributes?.birthDate && (
                <div>
                  <span className="font-medium text-gray-600">تاريخ الميلاد:</span>
                  <span className="mr-2 text-gray-800">
                    {new Date(selectedNode.attributes.birthDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              )}
              {selectedNode.attributes?.deathDate && (
                <div>
                  <span className="font-medium text-gray-600">تاريخ الوفاة:</span>
                  <span className="mr-2 text-gray-800">
                    {new Date(selectedNode.attributes.deathDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              )}
              {selectedNode.attributes?.phone && (
                <div>
                  <span className="font-medium text-gray-600">الهاتف:</span>
                  <span className="mr-2 text-gray-800 font-mono" dir="ltr">
                    {selectedNode.attributes.phone}
                  </span>
                </div>
              )}
              {selectedNode.children && (
                <div>
                  <span className="font-medium text-gray-600">عدد الأطفال:</span>
                  <span className="mr-2 text-gray-800">{selectedNode.children.length}</span>
                </div>
              )}
            </div>

            {selectedNode.attributes?.notes && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="font-medium text-amber-800">ملاحظات:</span>
                <p className="mt-1 text-amber-700">{selectedNode.attributes.notes}</p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(selectedNode.attributes?.id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                تعديل
              </button>
              <button
                onClick={() => handleDelete(selectedNode.attributes?.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                حذف
              </button>
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
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>على قيد الحياة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>متوفى</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">3</div>
              <span>عدد الأطفال</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">انقر على العقدة لعرض التفاصيل</span>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}