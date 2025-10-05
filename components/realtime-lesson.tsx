'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LessonsTable, type Lesson } from './lesson-table';

type RealtimeLessonsProps = {
    serverLessons: Lesson[];
};

export function RealtimeLessons({ serverLessons }: RealtimeLessonsProps) {
    const [lessons, setLessons] = useState(serverLessons);
    const supabase = createClient();

    useEffect(() => {
        setLessons(serverLessons);
    }, [serverLessons]);

    useEffect(() => {
        const channel = supabase
            .channel('realtime lessons')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lessons' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLessons((currentLessons) => [payload.new as Lesson, ...currentLessons]);
                    }
                    if (payload.eventType === 'UPDATE') {
                        setLessons((currentLessons) =>
                            currentLessons.map(lesson =>
                                lesson.id === payload.new.id ? { ...lesson, ...(payload.new as Lesson) } : lesson
                            )
                        );
                    }
                    if (payload.eventType === 'DELETE') {
                        setLessons((currentLessons) =>
                            currentLessons.filter(lesson => lesson.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return <LessonsTable lessons={lessons} />;
}
