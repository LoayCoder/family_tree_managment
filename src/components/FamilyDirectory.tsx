import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, User, Calendar, Phone, Heart, Skull, Baby } from 'lucide-react';
import { FamilyMemberWithLevel } from '../types/FamilyMember';
import { familyService } from '../services/supabase';

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
      <div className="family-directory-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>جاري تحميل دليل العائلة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="family-directory">
      {/* Header */}
      <div className="directory-header">
        <div className="header-content">
          <div className="header-icon">
            <Users className="icon" />
          </div>
          <div className="header-text">
            <h2>دليل العائلة التفاعلي</h2>
            <p>عدد الأعضاء: {members.reduce((total, member) => total + 1 + member.childrenCount, 0)}</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="search-container">
          <input
            type="text"
            placeholder="البحث في دليل العائلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Family Cards */}
      <div className="family-cards-container">
        {filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على أعضاء يطابقون البحث</p>
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
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 32px;
          border: 1px solid #f3f4f6;
        }

        .family-directory-loading {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 48px;
          border: 1px solid #f3f4f6;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 500;
          color: #6b7280;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 4px solid #10b981;
          border-top: 4px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .directory-header {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          padding: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }

        .header-icon .icon {
          width: 24px;
          height: 24px;
          color: white;
        }

        .header-text h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .header-text p {
          color: #6b7280;
          margin: 0;
        }

        .search-container {
          position: relative;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          font-size: 16px;
          transition: all 0.2s ease;
          background: #f9fafb;
        }

        .search-input:focus {
          outline: none;
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .family-cards-container {
          display: grid;
          gap: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #6b7280;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          color: #d1d5db;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          margin: 0;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .directory-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .family-cards-container {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .family-cards-container {
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .family-directory {
            padding: 20px;
            border-radius: 16px;
          }

          .header-text h2 {
            font-size: 24px;
          }

          .search-input {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
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

  const getGenderIcon = (gender: string | null) => {
    return <User className="gender-icon" />;
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
                {getGenderIcon(member.gender)}
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
          border-radius: 20px;
          border: 2px solid #f3f4f6;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .member-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: translateY(-2px);
        }

        .member-card.deceased {
          border-color: #e5e7eb;
          background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
        }

        .card-header {
          padding: 24px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.2s ease;
        }

        .card-header:hover {
          background: #f9fafb;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }

        .avatar-icon {
          width: 28px;
          height: 28px;
          color: white;
        }

        .member-details {
          flex: 1;
        }

        .member-name {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .member-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .status-badge, .age-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
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
          width: 12px;
          height: 12px;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .children-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid #fde68a;
        }

        .children-icon {
          width: 16px;
          height: 16px;
        }

        .expand-button {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expand-button:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .expand-icon {
          width: 20px;
          height: 20px;
          color: #6b7280;
          transition: transform 0.2s ease;
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
          max-height: 2000px;
          opacity: 1;
        }

        .member-expanded-info {
          padding: 0 24px 24px;
          border-top: 1px solid #f3f4f6;
          margin-top: 0;
        }

        .info-grid {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #f3f4f6;
        }

        .info-item.death-info {
          background: #fafafa;
          border-color: #e5e7eb;
        }

        .info-icon {
          width: 20px;
          height: 20px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .info-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          display: block;
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }

        .notes-section {
          margin-top: 20px;
          padding: 16px;
          background: #fffbeb;
          border-radius: 12px;
          border: 1px solid #fde68a;
        }

        .notes-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
        }

        .notes-section p {
          margin: 0;
          font-size: 14px;
          color: #78350f;
          line-height: 1.5;
        }

        .children-section {
          padding: 24px;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
        }

        .children-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .children-title-icon {
          width: 20px;
          height: 20px;
          color: #10b981;
        }

        .children-grid {
          display: grid;
          gap: 12px;
        }

        .child-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .child-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .child-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .child-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .child-avatar-icon {
          width: 20px;
          height: 20px;
          color: white;
        }

        .child-info {
          flex: 1;
        }

        .child-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .child-age {
          font-size: 12px;
          color: #6b7280;
        }

        .child-status {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .child-status.status-alive {
          background: #dcfce7;
        }

        .child-status.status-deceased {
          background: #f3f4f6;
        }

        .child-status-icon {
          width: 16px;
          height: 16px;
        }

        .child-contact {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
          font-size: 14px;
          color: #6b7280;
        }

        .child-contact-icon {
          width: 16px;
          height: 16px;
        }

        /* Responsive Design */
        @media (min-width: 640px) {
          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .children-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .card-header {
            padding: 16px;
          }

          .member-expanded-info {
            padding: 0 16px 16px;
          }

          .children-section {
            padding: 16px;
          }

          .member-name {
            font-size: 18px;
          }

          .member-meta {
            gap: 8px;
          }

          .avatar {
            width: 48px;
            height: 48px;
          }

          .avatar-icon {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
}