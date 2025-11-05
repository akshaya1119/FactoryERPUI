import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Input, Typography, message } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';


const { TextArea } = Input;
const { Text } = Typography;

const CatchDetailModal = ({ show, handleClose, data, processId, handleSave }) => {
    const { t } = useTranslation();

    const [isPlaying, setIsPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState(null);
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestError, setRequestError] = useState(null);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                setRequestError(null);
                const response = await API.get('/Processes');
                setProcesses(response.data);
            } catch (error) {
                console.error('Error fetching processes:', error);
                setRequestError('Failed to fetch processes');
                message.error('Failed to fetch processes');
            } finally {
                setLoading(false);
            }
        };

        if (show) {
            fetchProcesses();
        }

        return () => {
            setProcesses([]);
            setRequestError(null);
        };
    }, [show]);

    useEffect(() => {
        if (!show && audioElement) {
            audioElement.pause();
            setIsPlaying(false);
            setAudioElement(null);
        }
    }, [show, audioElement]);

    if (!show) return null;

    const formatKey = (key) => {
        return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'NA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const tableData = Object.keys(data || {})
        .filter(key => !['serialNumber', 'voiceRecording', 'teamUserNames', 'teamId', 'transactionId', 'srNo', 'projectId', 'processIds', 'previousProcessData', 'machineId', 'zoneId', 'percentageCatch', 'alerts', 'independentProcessData', 'processId'].includes(key))
        .map((key, index) => {
            let value = data[key];

            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    value = value.join(', ');
                } else {
                    value = JSON.stringify(value);
                }
            }
            if (key === 'team') {
                value = data.teamUserNames?.join(', ') || 'No team assigned';
            }
            if (key === 'examDate') {
                value = formatDate(value);
            }

            if (key === 'status') {
                switch (value) {
                    case 0:
                        value = 'Pending';
                        break;
                    case 1:
                        value = 'Started';
                        break;
                    case 2:
                        value = 'Completed';
                        break;
                    default:
                        value = 'N/A';
                }
            }
            return {
                key: index,
                label: formatKey(key),
                value: value || `No ${key}`,
            };
        });

    if (data?.teamUserNames?.length) {
        tableData.push({
            key: 'team',
            label: 'Team Members',
            value: data.teamUserNames.join(', ')
        });
    }

    const handleAudioPlay = async (audioData) => {
        if (!audioData) {
            message.info('No audio recording available');
            return;
        }

        try {
            if (isPlaying && audioElement) {
                audioElement.pause();
                setIsPlaying(false);
                return;
            }

            const byteCharacters = atob(audioData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'audio/wav' });

            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            audio.onplay = () => {
                setIsPlaying(true);
            };
            audio.onpause = () => {
                setIsPlaying(false);
            };
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            setAudioElement(audio);
            audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            message.error('Failed to play audio recording');
            setIsPlaying(false);
        }
    };

    const renderAudioControl = (voiceRecording) => {
        if (!voiceRecording) {
            return (
                <AudioMutedOutlined
                    style={{ fontSize: '18px', color: 'gray' }}
                    className='rounded-circle border p-2'
                />
            );
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPlaying ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AudioOutlined
                            style={{
                                fontSize: '18px',
                                cursor: 'pointer',
                                color: '#1890ff'
                            }}
                            onClick={() => handleAudioPlay(voiceRecording)}
                            className='rounded-circle border p-2 custom-theme-dark-btn'
                        />
                        <span
                            className="animate-pulse"
                            style={{
                                marginLeft: '8px',
                                color: '#1890ff',
                                fontSize: '12px'
                            }}
                        >
                            Playing...
                        </span>
                    </div>
                ) : (
                    <AudioOutlined
                        style={{ fontSize: '18px', cursor: 'pointer' }}
                        onClick={() => handleAudioPlay(voiceRecording)}
                        className='rounded-circle border p-2 custom-theme-dark-btn'
                    />
                )}
            </div>
        );
    };

    const handleResolve = async () => {
        try {
            setLoading(true);
            let existingTransactionData;

            if (data.transactionId) {
                const response = await API.get(`/Transactions/${data.transactionId}`);
                existingTransactionData = response.data;
            }

            const postData = {
                ...existingTransactionData,
                transactionId: data.transactionId || 0,
                projectId: data.projectId,
                quantitysheetId: data.srNo || 0,
                processId: processId,
                lotNo: data.lotNo,
                alarmId: "0",
                interimQuantity: existingTransactionData?.interimQuantity ?? 0,
                remarks: existingTransactionData?.remarks ?? "",
                zoneId: existingTransactionData?.zoneId ?? 0,
                machineId: existingTransactionData?.machineId ?? 0,
                status: existingTransactionData?.status ?? 0,
                teamId: existingTransactionData?.teamId ?? [],
                voiceRecording: existingTransactionData?.voiceRecording ?? ""
            };

            await API.post('/Transactions', postData);
            handleSave("0")
            handleClose();
        } catch (err) {
            console.error('Error saving alarm:', err);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Field',
            dataIndex: 'label',
            key: 'label',
            width: '30%',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Details',
            dataIndex: 'value',
            key: 'value',
            render: (value, record) => {
                if (record.label === 'Remarks' || record.label === 'Alarm Message') {
                    return (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <TextArea
                                    value={value}
                                    readOnly
                                    autoSize={{ minRows: 2, maxRows: 6 }}
                                    bordered={false}
                                    style={{ flex: 1, marginRight: '10px', overflow: 'hidden', wordWrap: 'break-word' }}
                                />
                                {record.label === 'Remarks' && renderAudioControl(data?.voiceRecording)}
                            </div>
                            {record?.label === 'Alarm Message' && value !== "0" && value !== 'NA' && value !== null && value !== 'No alerts' && (
                                <Button
                                    style={{ fontSize: '18px', cursor: 'pointer' }}
                                    onClick={handleResolve}
                                    className='d-flex align-items-center border p-2 custom-theme-dark-btn'
                                >
                                    Resolve
                                </Button>
                            )}
                        </>
                    );
                }
                return <Text>{value}</Text>;
            },
        },
    ];

    return (
        <Modal
            open={show}
            onCancel={handleClose}
            footer={[
                <Button key="close" type="primary" onClick={handleClose} className='custom-theme-dark-btn'>
                    Close
                </Button>
            ]}
            centered
            title={`${t('catchDetails')}`}
            width={600}
            className="bg-light rounded"
        >
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                showHeader={false}
                bordered
            />
        </Modal>
    );
};

export default CatchDetailModal;
