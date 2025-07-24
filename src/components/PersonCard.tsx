import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Building, Heart, Skull, Users, Crown } from 'lucide-react';
import { ChildrenDisplayManager } from './ChildrenDisplay/ChildrenDisplayManager';
import { childrenService } from '../services/childrenService';
import { PersonWithDetails } from '../services/arabicFamilyService';

interface PersonCardProps {
  person: PersonWithDetails;
}

export default function PersonCard({ person }: PersonCardProps) {
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadChildrenCount();
  }, [person.id]);

  const loadChildrenCount = async () => {
    setIsLoading(true);
    try {
      const count = await childrenService.getChildrenCount(person.id);
      setChildrenCount(count);
    } catch (error) {
      console.error('Error loading children count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGenerationGradient = (level: number) => {
    const gradients = [
      'from-purple-500 to-purple-600', // Root level
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    return gradients[(level - 1) % gradients.length] || gradients[0];
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100 overflow-hidden">
      {/* Header with generation indicator */}
      <div className={`h-2 bg-gradient-to-r ${getGenerationGradient(person.مستوى_الجيل)}`}></div>
      
      <div className="p-4">
        {/* Person Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getGenerationGradient(person.مستوى_الجيل)} shadow-sm`}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-800 mb-0.5 truncate">{person.الاسم_الكامل}</h4>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                الجيل {person.مستوى_الجيل}
              </span>
              {person.is_notable && (
                <span className="text-xs bg-amber-100 px-1.5 py-0.5 rounded-full text-amber-700 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  شخصية بارزة
                </span>
              )}
              {person.رقم_هوية_وطنية && (
                <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded-full text-blue-700 truncate max-w-[100px]">
                  {person.رقم_هوية_وطنية}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Person Details - Compact for Landscape */}
        <div className="space-y-1.5 text-xs">
          {person.تاريخ_الميلاد && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">الميلاد: {new Date(person.تاريخ_الميلاد).toLocaleDateString('ar-SA')}</span>
            </div>
          )}

          {person.مكان_الميلاد && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">{person.مكان_الميلاد}</span>
            </div>
          )}

          {person.اسم_الفرع && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">{person.اسم_الفرع}</span>
            </div>
          )}

          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            {person.تاريخ_الوفاة ? (
              <>
                <Skull className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">متوفى: {new Date(person.تاريخ_الوفاة).toLocaleDateString('ar-SA')}</span>
              </>
            ) : (
              <>
                <Heart className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">على قيد الحياة</span>
              </>
            )}
          </div>
        </div>

        {/* Children Display */}
        <ChildrenDisplayManager
          personId={person.id}
          personName={person.الاسم_الكامل}
          initialChildrenCount={childrenCount}
        />
      </div>
    </div>
  );
}