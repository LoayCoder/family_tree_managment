import React from 'react';
import { Users, Heart, Calendar, MapPin, Award, User, Phone, FileText } from 'lucide-react';
import { ChildCard } from '../../services/childrenService';

interface MiniChildCardProps {
  child: ChildCard;
  onClick: () => void;
  displayMode: 'mini' | 'detailed';
}

export const MiniChildCard: React.FC<MiniChildCardProps> = ({ 
  child, 
  onClick, 
  displayMode = 'mini' 
}) => {
  const ageDisplay = child.displayData.status === 'alive' 
    ? `${child.displayData.currentAge || 'غير محدد'} سنة`
    : `${child.displayData.birthYear} - متوفى`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (displayMode === 'detailed') {
    return (
      <div 
        className={`detailed-child-card ${child.displayData.status}`}
        onClick={onClick}
        style={{ 
          borderLeftColor: child.visualTheme.inheritedColor,
        }}
      >
        {/* Header */}
        <div className="card-header">
          <div className="child-avatar">
            <div className="avatar-placeholder">
              <User className="avatar-icon" />
            </div>
            {child.quickStats.hasChildren && (
              <div className="has-children-indicator">
                <Users size={10} />
              </div>
            )}
          </div>
          
          <div className="child-main-info">
            <h4 className="child-name">{child.displayData.name}</h4>
            <div className="child-meta">
              <span className={`status-badge ${child.displayData.status}`}>
                {child.displayData.status === 'alive' ? 'على قيد الحياة' : 'متوفى'}
              </span>
              <span className="generation-badge">
                الجيل {child.visualTheme.generationLevel}
              </span>
            </div>
          </div>

          <div className="quick-stats">
            {child.quickStats.childrenCount > 0 && (
              <div className="stat-item">
                <Users size={14} />
                <span>{child.quickStats.childrenCount}</span>
              </div>
            )}
            {child.quickStats.achievementsCount > 0 && (
              <div className="stat-item">
                <Award size={14} />
                <span>{child.quickStats.achievementsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="details-grid">
          {child.fullData.birthDate && (
            <div className="detail-item">
              <Calendar className="detail-icon" size={16} />
              <div>
                <span className="detail-label">تاريخ الميلاد</span>
                <span className="detail-value">{formatDate(child.fullData.birthDate)}</span>
              </div>
            </div>
          )}

          {child.fullData.location && (
            <div className="detail-item">
              <MapPin className="detail-icon" size={16} />
              <div>
                <span className="detail-label">مكان الميلاد</span>
                <span className="detail-value">{child.fullData.location}</span>
              </div>
            </div>
          )}

          {child.fullData.position && (
            <div className="detail-item">
              <User className="detail-icon" size={16} />
              <div>
                <span className="detail-label">المنصب</span>
                <span className="detail-value">{child.fullData.position}</span>
              </div>
            </div>
          )}

          {child.fullData.nationalId && (
            <div className="detail-item">
              <FileText className="detail-icon" size={16} />
              <div>
                <span className="detail-label">الهوية الوطنية</span>
                <span className="detail-value" dir="ltr">{child.fullData.nationalId}</span>
              </div>
            </div>
          )}

          {child.quickStats.isMarried && child.quickStats.spouse && (
            <div className="detail-item marriage-info">
              <Heart className="detail-icon" size={16} />
              <div>
                <span className="detail-label">الزوجة</span>
                <span className="detail-value">{child.quickStats.spouse}</span>
              </div>
            </div>
          )}

          {child.fullData.education && (
            <div className="detail-item">
              <Award className="detail-icon" size={16} />
              <div>
                <span className="detail-label">التعليم</span>
                <span className="detail-value">{child.fullData.education}</span>
              </div>
            </div>
          )}
        </div>

        {child.fullData.notes && (
          <div className="notes-section">
            <h5>ملاحظات</h5>
            <p>{child.fullData.notes}</p>
          </div>
        )}

        <style jsx>{`
          .detailed-child-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid #e2e8f0;
            border-left: 4px solid;
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
            margin-bottom: 12px;
          }

          .detailed-child-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border-color: #cbd5e1;
          }

          .detailed-child-card.deceased {
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            border-color: #d1d5db;
          }

          .card-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
          }

          .child-avatar {
            position: relative;
            flex-shrink: 0;
          }

          .avatar-placeholder {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .avatar-icon {
            color: #64748b;
            width: 24px;
            height: 24px;
          }

          .has-children-indicator {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            border: 2px solid white;
          }

          .child-main-info {
            flex: 1;
            min-width: 0;
          }

          .child-name {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 6px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .child-meta {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .status-badge, .generation-badge {
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
          }

          .status-badge.alive {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }

          .status-badge.deceased {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .generation-badge {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
          }

          .quick-stats {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 6px;
            background: #f1f5f9;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #475569;
          }

          .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
          }

          .detail-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .detail-item.marriage-info {
            background: #fef7f7;
            border-color: #fecaca;
          }

          .detail-icon {
            color: #64748b;
            flex-shrink: 0;
          }

          .detail-item.marriage-info .detail-icon {
            color: #dc2626;
          }

          .detail-label {
            display: block;
            font-size: 10px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 1px;
          }

          .detail-value {
            display: block;
            font-size: 12px;
            color: #1e293b;
            font-weight: 600;
          }

          .notes-section {
            margin-top: 12px;
            padding: 10px;
            background: #fffbeb;
            border-radius: 8px;
            border: 1px solid #fde68a;
          }

          .notes-section h5 {
            margin: 0 0 6px 0;
            font-size: 12px;
            font-weight: 600;
            color: #92400e;
          }

          .notes-section p {
            margin: 0;
            font-size: 11px;
            color: #78350f;
            line-height: 1.4;
          }

          @media (max-width: 768px) {
            .details-grid {
              grid-template-columns: 1fr;
            }
            
            .card-header {
              flex-direction: column;
              gap: 8px;
            }
            
            .quick-stats {
              flex-direction: row;
            }
          }
        `}</style>
      </div>
    );
  }

  // Mini card mode - Landscape optimized
  return (
    <div 
      className={`mini-child-card ${child.displayData.status}`}
      onClick={onClick}
      style={{ 
        borderLeftColor: child.visualTheme.inheritedColor,
      }}
    >
      <div className="child-avatar">
        <div className="avatar-placeholder">
          <User className="avatar-icon" />
        </div>
        {child.quickStats.hasChildren && (
          <div className="has-children-indicator">
            <Users size={8} />
          </div>
        )}
      </div>
      
      <div className="child-info">
        <h4 className="child-name">{child.displayData.name}</h4>
        <p className="child-age">{ageDisplay}</p>
        
        {child.quickStats.isMarried && child.quickStats.spouse && (
          <div className="marriage-indicator">
            <Heart size={8} />
            <span>{child.quickStats.spouse}</span>
          </div>
        )}
      </div>
      
      <div className="child-stats">
        {child.quickStats.childrenCount > 0 && (
          <span className="stat-badge">
            👥 {child.quickStats.childrenCount}
          </span>
        )}
      </div>

      <style jsx>{`
        .mini-child-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-left: 2px solid;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .mini-child-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .mini-child-card.deceased {
          background: #fafafa;
          border-color: #d1d5db;
        }

        .child-avatar {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-icon {
          color: #64748b;
          width: 16px;
          height: 16px;
        }

        .has-children-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 1px solid white;
        }

        .child-info {
          flex: 1;
          min-width: 0;
        }

        .child-name {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .child-age, .child-title {
          font-size: 10px;
          color: #64748b;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .marriage-indicator {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 9px;
          color: #dc2626;
          margin-top: 2px;
        }

        .marriage-indicator span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 80px;
        }

        .child-stats {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
        }

        .stat-badge {
          font-size: 9px;
          padding: 1px 4px;
          background: #f1f5f9;
          border-radius: 4px;
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};