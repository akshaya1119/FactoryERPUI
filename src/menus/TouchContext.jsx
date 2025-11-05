import React, { createContext, useContext, useState, useCallback } from 'react';

const TouchContext = createContext();

export const TouchProvider = ({ children }) => {
    const [isTouching, setIsTouching] = useState(false);

    const startTouch = useCallback(() => setIsTouching(true), []);
    const endTouch = useCallback(() => setIsTouching(false), []);

    return (
        <TouchContext.Provider value={{ isTouching, startTouch, endTouch }}>
            {children}
        </TouchContext.Provider>
    );
};

export const useTouch = () => useContext(TouchContext);
