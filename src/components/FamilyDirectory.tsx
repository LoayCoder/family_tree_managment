import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, User, Calendar, Phone, Heart, Skull, Baby } from 'lucide-react';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService } from '../services/supabase';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import ResponsiveText from './responsive/ResponsiveText';

interface FamilyDirectoryProps {
  refreshTrigger: number;
}

interface FamilyMemberWithChildren extends FamilyMemberWithLevel {
  children: FamilyMemberWithChildren[];
  childrenCount: number;
}

export default function FamilyDirectory({ refreshTrigger }: FamilyDirectoryProps) {
  const [members, setMembers] = useState<FamilyMemberWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFamilyDirectory();
  }, [refreshTrigger]);

  const loadFamilyDirectory = async () => {
    setLoading(true);
    try {
      const data = await familyService.getFamilyTree();
      const structuredData = buildFamilyStructure(data);
      setMembers(structuredData);
    } catch (error) {
      console.error('Error loading family directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFamilyStructure = (flatMembers: FamilyMemberWithLevel[]): FamilyMemberWithChildren[] => {
    const memberMap = new Map<string, FamilyMemberWithChildren>();
    
    // Initialize all members with empty children arrays
    flatMembers.forEach(member => {
      memberMap.set(member.id, {
        ...member,
        children: [],
        childrenCount: 0
      });
    });

    const rootMembers: FamilyMemberWithChildren[] = [];

    // Build the tree structure
    flatMembers.forEach(member => {
      const memberWithChildren = memberMap.get(member.id)!;
      
      if (member.parent_id) {
        const parent = memberMap.get(member.parent_id);
        if (parent) {
          parent.children.push(memberWithChildren);
          parent.childrenCount = parent.children.length;
        }
      } else {
        rootMembers.push(memberWithChildren);
      }
    });

    return rootMembers;
  };

  const toggleCardExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedCards(newExpanded);
  };

  const filterMembers = (members: FamilyMemberWithChildren[], searchTerm: string): FamilyMemberWithChildren[] => {
    if (!searchTerm) return members;
    
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = member.children.some(child => 
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesSearch || hasMatchingChildren;
    }).map(member => ({
      ...member,
      children: member.children.filter(child =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | null, deathDate: string | null = null): string => {
    if (!birthDate) return 'غير محدد';
    
    const birth = new Date(birthDate);
    const endDate = deathDate ? new Date(deathDate) : new Date();
    const age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      return `${age - 1} سنة`;
    }
    
    return `${age} سنة`;
  };

  const filteredMembers = filterMembers(members, searchTerm);

  if (loading) {
    return (
      <ResponsiveContainer>
        <div className="family-directory-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>جاري تحميل دليل آل عمير...</span>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="family-directory bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100">
        {/* Header */}
        <div className="directory-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="header-content flex items-center gap-3 sm:gap-4">
            <div className="header-icon p-2 sm:p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md">
              <Users className="icon w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="header-text">
              <ResponsiveText as="h2" size="2xl" weight="bold" color="gray-800">
                دليل آل عمير التفاعلي
              </ResponsiveText>
              <ResponsiveText size="sm" color="gray-600">
                عدد الأعضاء: {members.reduce((total, member) => total + 1 + member.childrenCount, 0)}
              </ResponsiveText>
            </div>
          </div>
          
          {/* Search */}
          <div className="search-container w-full sm:w-auto max-w-md">
            <input
              type="text"
              placeholder="البحث في دليل آل عمير..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>
        </div>

        {/* Family Cards */}
        <div className="family-cards-container grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.length === 0 ? (
            <div className="empty-state col-span-full py-12 text-center">
              <Users className="empty-icon w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2" />
              <ResponsiveText as="h3" size="xl" weight="semibold" color="gray-600" className="mb-2">
                لا توجد نتائج
              </ResponsiveText>
              <ResponsiveText size="base" color="gray-500">
                لم يتم العثور على أعضاء يطابقون البحث
              </ResponsiveText>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                isExpanded={expandedCards.has(member.id)}
                onToggleExpansion={() => toggleCardExpansion(member.id)}
                formatDate={formatDate}
                calculateAge={calculateAge}
              />
            ))
          )}
        </div>

        <style jsx>{`
          .family-directory {
            transition: all 0.3s ease;
          }

          .family-directory-loading {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 1rem 1.5rem -0.3rem rgba(0, 0, 0, 0.1);
            padding: 3rem;
            border: 1px solid #f3f4f6;
            text-align: center;
          }

          .loading-spinner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 1.125rem;
            font-weight: 500;
            color: #6b7280;
          }

          .spinner {
            width: 2rem;
            height: 2rem;
            border: 0.25rem solid #10b981;
            border-top: 0.25rem solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .empty-state {
            color: #6b7280;
          }

          @media (max-width: 640px) {
            .family-directory {
              padding: 1.25rem;
              border-radius: 1rem;
            }
            
            .loading-spinner {
              font-size: 1rem;
            }
            
            .spinner {
              width: 1.5rem;
              height: 1.5rem;
              border-width: 0.2rem;
            }
          }
        `}</style>
      </div>
    </ResponsiveContainer>
  );
}

interface FamilyMemberCardProps {
  member: FamilyMemberWithChildren;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  formatDate: (date: string | null) => string;
  calculateAge: (birthDate: string | null, deathDate?: string | null) => string;
}

function FamilyMemberCard({ 
  member, 
  isExpanded, 
  onToggleExpansion, 
  formatDate, 
  calculateAge 
}: FamilyMemberCardProps) {
  const getStatusColor = (isAlive: boolean | undefined) => {
    if (isAlive === false) return 'status-deceased';
    return 'status-alive';
  };

  return (
    <div className={`member-card ${member.is_alive === false ? 'deceased' : 'alive'}`}>
      {/* Card Header */}
      <div className="card-header" onClick={onToggleExpansion}>
        <div className="member-info">
          <div className="avatar">
            <User className="avatar-icon" />
          </div>
          <div className="member-details">
            <h3 className="member-name">{member.name}</h3>
            <div className="member-meta">
              <span className={`status-badge ${getStatusColor(member.is_alive)}`}>
                {member.is_alive === false ? (
                  <>
                    <Skull className="status-icon" />
                    متوفى
                  </>
                ) : (
                  <>
                    <Heart className="status-icon" />
                    على قيد الحياة
                  </>
                )}
              </span>
              <span className="age-badge">
                <Calendar className="age-icon" />
                {calculateAge(member.birth_date, member.date_of_death)}
              </span>
            </div>
          </div>
        </div>

        <div className="card-actions">
          {member.childrenCount > 0 && (
            <div className="children-badge">
              <Baby className="children-icon" />
              <span className="children-count">{member.childrenCount}</span>
            </div>
          )}
          <button className="expand-button" aria-label={isExpanded ? 'طي' : 'توسيع'}>
            {isExpanded ? (
              <ChevronDown className="expand-icon" />
            ) : (
              <ChevronRight className="expand-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`card-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Member Details */}
        <div className="member-expanded-info">
          <div className="info-grid">
            {member.birth_date && (
              <div className="info-item">
                <Calendar className="info-icon" />
                <div>
                  <span className="info-label">تاريخ الميلاد</span>
                  <span className="info-value">{formatDate(member.birth_date)}</span>
                </div>
              </div>
            )}
            
            {member.phone && (
              <div className="info-item">
                <Phone className="info-icon" />
                <div>
                  <span className="info-label">الهاتف</span>
                  <span className="info-value" dir="ltr">{member.phone}</span>
                </div>
              </div>
            )}

            {member.gender && (
              <div className="info-item">
                <User className="info-icon" />
                <div>
                  <span className="info-label">الجنس</span>
                  <span className="info-value">{member.gender}</span>
                </div>
              </div>
            )}

            {member.is_alive === false && member.date_of_death && (
              <div className="info-item death-info">
                <Skull className="info-icon" />
                <div>
                  <span className="info-label">تاريخ الوفاة</span>
                  <span className="info-value">{formatDate(member.date_of_death)}</span>
                </div>
              </div>
            )}
          </div>

          {member.notes && (
            <div className="notes-section">
              <h4>ملاحظات</h4>
              <p>{member.notes}</p>
            </div>
          )}
        </div>

        {/* Children Section */}
        {member.children.length > 0 && (
          <div className="children-section">
            <h4 className="children-title">
              <Baby className="children-title-icon" />
              الأطفال ({member.children.length})
            </h4>
            <div className="children-grid">
              {member.children.map((child) => (
                <div key={child.id} className="child-card">
                  <div className="child-header">
                    <div className="child-avatar">
                      <User className="child-avatar-icon" />
                    </div>
                    <div className="child-info">
                      <h5 className="child-name">{child.name}</h5>
                      <span className="child-age">
                        {calculateAge(child.birth_date, child.date_of_death)}
                      </span>
                    </div>
                    <span className={`child-status ${getStatusColor(child.is_alive)}`}>
                      {child.is_alive === false ? (
                        <Skull className="child-status-icon" />
                      ) : (
                        <Heart className="child-status-icon" />
                      )}
                    </span>
                  </div>
                  {child.phone && (
                    <div className="child-contact">
                      <Phone className="child-contact-icon" />
                      <span dir="ltr">{child.phone}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .member-card {
          background: white;
          border-radius: 1.25rem;
          border: 0.125rem solid #f3f4f6;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1);
        }

        .member-card:hover {
          box-shadow: 0 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1), 0 0.625rem 0.625rem -0.3125rem rgba(0, 0, 0, 0.04);
          transform: translateY(-0.125rem);
        }

        .member-card.deceased {
          border-color: #e5e7eb;
          background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
        }

        .card-header {
          padding: 1.25rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        @media (max-width: 640px) {
          .card-header {
            padding: 1rem;
          }
        }

        .card-header:hover {
          background: #f9fafb;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        @media (max-width: 640px) {
          .member-info {
            gap: 0.5rem;
          }
        }

        .avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0.25rem 0.375rem -0.0625rem rgba(16, 185, 129, 0.3);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .avatar {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
          }
        }

        .avatar-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
        }

        @media (max-width: 640px) {
          .avatar-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }

        .member-details {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .member-name {
            font-size: 1rem;
            margin-bottom: 0.25rem;
          }
        }

        .member-meta {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .member-meta {
            gap: 0.5rem;
          }
        }

        .status-badge, .age-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .status-badge, .age-badge {
            padding: 0.125rem 0.5rem;
            font-size: 0.625rem;
            border-radius: 0.5rem;
          }
        }

        .status-badge.status-alive {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-badge.status-deceased {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .age-badge {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .status-icon, .age-icon {
          width: 0.75rem;
          height: 0.75rem;
        }

        @media (max-width: 640px) {
          .status-icon, .age-icon {
            width: 0.625rem;
            height: 0.625rem;
          }
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .card-actions {
            gap: 0.5rem;
          }
        }

        .children-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid #fde68a;
        }

        @media (max-width: 640px) {
          .children-badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            gap: 0.25rem;
            border-radius: 0.5rem;
          }
        }

        .children-icon {
          width: 1rem;
          height: 1rem;
        }

        @media (max-width: 640px) {
          .children-icon {
            width: 0.875rem;
            height: 0.875rem;
          }
        }

        .expand-button {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 0.125rem solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        @media (max-width: 640px) {
          .expand-button {
            width: 2rem;
            height: 2rem;
            border-radius: 0.5rem;
          }
        }

        .expand-button:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .expand-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #6b7280;
          transition: transform 0.2s ease;
        }

        @media (max-width: 640px) {
          .expand-icon {
            width: 1rem;
            height: 1rem;
          }
        }

        .card-content {
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-content.collapsed {
          max-height: 0;
          opacity: 0;
        }

        .card-content.expanded {
          max-height: 125rem;
          opacity: 1;
        }

        .member-expanded-info {
          padding: 0 1.25rem 1.25rem;
          border-top: 1px solid #f3f4f6;
          margin-top: 0;
        }

        @media (max-width: 640px) {
          .member-expanded-info {
            padding: 0 1rem 1rem;
          }
        }

        .info-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1.25rem;
          grid-template-columns: repeat(1, 1fr);
        }

        @media (min-width: 640px) {
          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #f3f4f6;
        }

        @media (max-width: 640px) {
          .info-item {
            padding: 0.5rem;
            gap: 0.5rem;
            border-radius: 0.5rem;
          }
        }

        .info-item.death-info {
          background: #fafafa;
          border-color: #e5e7eb;
        }

        .info-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #6b7280;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .info-icon {
            width: 1rem;
            height: 1rem;
          }
        }

        .info-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          display: block;
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .info-value {
            font-size: 0.75rem;
          }
        }

        .notes-section {
          margin-top: 1.25rem;
          padding: 1rem;
          background: #fffbeb;
          border-radius: 0.75rem;
          border: 1px solid #fde68a;
        }

        .notes-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #92400e;
        }

        .notes-section p {
          margin: 0;
          font-size: 0.875rem;
          color: #78350f;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .notes-section {
            padding: 0.75rem;
          }
          
          .notes-section h4 {
            font-size: 0.75rem;
          }
          
          .notes-section p {
            font-size: 0.75rem;
          }
        }

        .children-section {
          padding: 1.25rem;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
        }

        @media (max-width: 640px) {
          .children-section {
            padding: 1rem;
          }
        }

        .children-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        @media (max-width: 640px) {
          .children-title {
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
          }
        }

        .children-title-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #10b981;
        }

        @media (max-width: 640px) {
          .children-title-icon {
            width: 1rem;
            height: 1rem;
          }
        }

        .children-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(1, 1fr);
        }

        @media (min-width: 640px) {
          .children-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .child-card {
          background: white;
          border-radius: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        @media (max-width: 640px) {
          .child-card {
            padding: 0.5rem;
            border-radius: 0.5rem;
          }
        }

        .child-card:hover {
          box-shadow: 0 0.25rem 0.375rem rgba(0, 0, 0, 0.1);
          transform: translateY(-0.0625rem);
        }

        .child-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .child-header {
            gap: 0.5rem;
          }
        }

        .child-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.625rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .child-avatar {
            width: 2rem;
            height: 2rem;
            border-radius: 0.5rem;
          }
        }

        .child-avatar-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: white;
        }

        @media (max-width: 640px) {
          .child-avatar-icon {
            width: 1rem;
            height: 1rem;
          }
        }

        .child-info {
          flex: 1;
          min-width: 0;
        }

        .child-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .child-name {
            font-size: 0.875rem;
            margin-bottom: 0.125rem;
          }
        }

        .child-age {
          font-size: 0.75rem;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .child-age {
            font-size: 0.625rem;
          }
        }

        .child-status {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .child-status {
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 0.375rem;
          }
        }

        .child-status.status-alive {
          background: #dcfce7;
        }

        .child-status.status-deceased {
          background: #f3f4f6;
        }

        .child-status-icon {
          width: 1rem;
          height: 1rem;
        }

        @media (max-width: 640px) {
          .child-status-icon {
            width: 0.75rem;
            height: 0.75rem;
          }
        }

        .child-contact {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f3f4f6;
          font-size: 0.875rem;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .child-contact {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            font-size: 0.75rem;
            gap: 0.375rem;
          }
        }

        .child-contact-icon {
          width: 1rem;
          height: 1rem;
        }

        @media (max-width: 640px) {
          .child-contact-icon {
            width: 0.75rem;
            height: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}