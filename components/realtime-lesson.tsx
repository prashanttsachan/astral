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

    // This effect ensures that the client-side state is updated
    // if the server-rendered props change upon navigation.
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
                    // New lesson created, add it to the top of the list
                    if (payload.eventType === 'INSERT') {
                        setLessons((currentLessons) => [payload.new as Lesson, ...currentLessons]);
                    }
                    // A lesson was updated (e.g., status changed), find and update it
                    if (payload.eventType === 'UPDATE') {
                        setLessons((currentLessons) =>
                            currentLessons.map(lesson =>
                                lesson.id === payload.new.id ? { ...lesson, ...(payload.new as Lesson) } : lesson
                            )
                        );
                    }
                    // Note: Deletes are not handled, but could be added here if needed.
                }
            )
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return <LessonsTable lessons={lessons} />;
}
