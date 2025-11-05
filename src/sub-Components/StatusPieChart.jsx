import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const StatusPieChart = ({ data }) => {
    const { t } = useTranslation();

    const updateData = (jsonData) => {
        let pending = 0;
        let started = 0; 
        let completed = 0;

        jsonData?.forEach((item) => {
            if (item.status === 0) pending += 1;
            else if (item.status === 1) started += 1;
            else if (item.status === 2) completed += 1;
        });

        const total = (jsonData?.length || 1); // Prevent division by 0

        return [
            { 
                name: t('pending'), 
                value: (pending/total) * 100,
                count: pending,
                color: '#dc3545' // Bootstrap danger color
            },
            { 
                name: t('started'), 
                value: (started/total) * 100,
                count: started,
                color: '#ffc107' // Bootstrap warning color
            },
            { 
                name: t('completed'), 
                value: (completed/total) * 100,
                count: completed,
                color: '#198754' // Bootstrap success color
            }
        ];
    };

    const chartData = data ? updateData(data) : [
        { name: t('pending'), value: 0, count: 0, color: '#dc3545' }, // Bootstrap danger color
        { name: t('started'), value: 0, count: 0, color: '#ffc107' }, // Bootstrap warning color
        { name: t('completed'), value: 0, count: 0, color: '#198754' } // Bootstrap success color
    ];

    return (
        <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} barSize={40}> {/* Added barSize prop to reduce width */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                    formatter={(value, name, props) => [
                        `${value.toFixed(1)}% (${props.payload.count} items)`,
                        name
                    ]}
                />
                <Legend />
                <Bar 
                    dataKey="value" 
                    name={t('percentage')}
                    fill="#000"
                    stroke="#000"
                    fillOpacity={0.8}
                    strokeWidth={1}
                >
                    {
                        chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                    }
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default StatusPieChart;
