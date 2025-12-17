import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaHourglassHalf, FaExclamationTriangle, FaCheckCircle, FaClipboardCheck, FaTimesCircle, FaClock } from 'react-icons/fa';

const API_URL = 'http://localhost:8080';

const authHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// ... (QuestionComponent и Timer остаются без изменений) ...

// =======================================================
// Компонент для отображения одного вопроса 
// =======================================================
const QuestionComponent = ({ question, index, answers, setAnswers, submitted }) => {
    
    const currentAnswer = answers[question.id] || { questionId: question.id, selectedOptionsIds: [], textAnswer: '' };
    
    const handleOptionChange = (optionId, isMultiple) => {
        setAnswers(prev => {
            const current = prev[question.id] || { questionId: question.id, selectedOptionsIds: [], textAnswer: null };
            let newSelectedIds;

            if (isMultiple) {
                newSelectedIds = current.selectedOptionsIds.includes(optionId)
                    ? current.selectedOptionsIds.filter(id => id !== optionId)
                    : [...current.selectedOptionsIds, optionId];
            } else {
                newSelectedIds = [optionId];
            }

            return {
                ...prev,
                [question.id]: {
                    ...current,
                    selectedOptionsIds: newSelectedIds,
                    textAnswer: null 
                }
            };
        });
    };
    
    const handleTextChange = (e) => {
        const text = e.target.value;
        setAnswers(prev => {
            const current = prev[question.id] || { questionId: question.id, selectedOptionsIds: null, textAnswer: '' };
            return {
                ...prev,
                [question.id]: {
                    ...current,
                    selectedOptionsIds: null,
                    textAnswer: text
                }
            };
        });
    };

    const inputType = question.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';
    const isMultipleChoice = question.questionType === 'MULTIPLE_CHOICE';

    return (
        <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
                Вопрос {index + 1} (Балл: {question.points})
                <span className="badge bg-secondary ms-2">{question.questionType}</span>
            </div>
            <div className="card-body">
                <p className="card-text"><strong>{question.questionText}</strong></p>
                
                {(question.questionType === 'SINGLE_CHOICE' || question.questionType === 'MULTIPLE_CHOICE') && (
                    <ul className="list-group mt-3">
                        {question.options && question.options.map(option => (
                            <li key={option.id} className="list-group-item">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type={inputType}
                                        name={`question-${question.id}`}
                                        id={`option-${option.id}`}
                                        checked={currentAnswer.selectedOptionsIds.includes(option.id)}
                                        onChange={() => handleOptionChange(option.id, isMultipleChoice)}
                                        disabled={submitted}
                                    />
                                    <label className="form-check-label" htmlFor={`option-${option.id}`}>
                                        {option.text}
                                    </label>
                                </div>
                            </li>
                        ))}
                        {!question.options && <div className="alert alert-warning mt-2">Нет доступных вариантов ответа.</div>}
                    </ul>
                )}

                {question.questionType === 'ESSAY' && (
                    <textarea
                        className="form-control mt-3"
                        rows="5"
                        placeholder="Введите ваш развернутый ответ здесь. Этот ответ будет проверен преподавателем вручную."
                        value={currentAnswer.textAnswer || ''}
                        onChange={handleTextChange}
                        disabled={submitted}
                    />
                )}
            </div>
        </div>
    );
};


// =======================================================
// КОМПОНЕНТ ТАЙМЕРА
// =======================================================
const Timer = ({ initialTime, onSubmitTest }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime * 60); 
    
    const submitRef = React.useRef(onSubmitTest);
    submitRef.current = onSubmitTest;
    
    useEffect(() => {
        if (timeLeft <= 0) {
            submitRef.current(); 
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const isCritical = minutes < 5;

    return (
        <div className={`text-end mb-4 p-2 rounded ${isCritical ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
            <FaClock className="me-2" /> 
            Оставшееся время: 
            <strong>{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</strong>
        </div>
    );
};


// =======================================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРОХОЖДЕНИЯ ТЕСТА
// =======================================================

export const StudentCourseTestView = ({ course, onBack }) => {
    const courseId = course.id;
    const courseTitle = course.title;
    
    const [selectedTest, setSelectedTest] = useState(null); 
    const [testData, setTestData] = useState(null); 
    const [attemptId, setAttemptId] = useState(null); 
    const [answers, setAnswers] = useState({}); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false); 
    const [result, setResult] = useState(null); 
    
    
    // --- НОВАЯ ФУНКЦИЯ: Проверка наличия завершенной попытки ---
    const checkIfSubmittedAndGetResult = useCallback(async (testDetails) => {
        if (!testDetails || !testDetails.id) return false;
        
        try {
            // ПРЕДПОЛАГАЕМ, что вы добавили этот эндпоинт на бэкенд
            // GET /api/attempts/test/{testId}/latest-completed
            const response = await axios.get(`${API_URL}/api/attempts/test/${testDetails.id}/latest-completed`, authHeader());
            
            // 200 OK: Найдена завершенная попытка
            const latestAttemptResult = response.data;
            
            setResult(latestAttemptResult);
            setSelectedTest(testDetails);
            setSubmitted(true);
            setError(null);
            setLoading(false);
            
            return true;
            
        } catch (err) {
            // 404 Not Found: Завершенная попытка не найдена.
            if (err.response && err.response.status === 404) {
                 return false; 
            }
            // Другие ошибки:
            console.warn("Ошибка при проверке завершенной попытки:", err);
            return false;
        }
    }, []);


    // --- Шаг 2: Отправка ответов (Без изменений) ---
    const handleSubmitTest = useCallback(async () => {
        if (submitted || !attemptId) return;
        
        if (!submitted && !window.confirm("Вы уверены, что хотите завершить тест? Вы не сможете изменить ответы.")) return;
        
        const submissionData = {
            attemptId: attemptId,
            answers: Object.values(answers).map(ans => ({
                questionId: ans.questionId,
                selectedOptionsIds: ans.selectedOptionsIds,
                textAnswer: ans.textAnswer
            }))
        };
        
        setLoading(true);
        try {
            const submitResponse = await axios.post(`${API_URL}/api/attempts/${attemptId}/submit`, submissionData, authHeader());
            
            setResult(submitResponse.data); 
            setSubmitted(true);
            setError(null);

        } catch (err) {
            setError("Ошибка при отправке теста. Пожалуйста, обратитесь к администратору.");
            console.error("Ошибка отправки теста:", err);
        } finally {
            setLoading(false);
        }
    }, [attemptId, answers, submitted]);
    
    
    // --- Шаг 1b: Начать попытку прохождения теста (Упрощен, т.к. 409 обрабатывается заранее) ---
    const startTestSession = useCallback(async (testId) => {
        try {
            // 1. Начинаем попытку
            const startResponse = await axios.post(`${API_URL}/api/attempts/start/${testId}`, null, authHeader());
            const attempt = startResponse.data; 

            // 2. Получаем вопросы теста
            const questionsResponse = await axios.get(`${API_URL}/api/tests/${testId}/questions`, authHeader());
            const questions = questionsResponse.data; 

            // 3. Получаем детали теста
            const testDetailsResponse = await axios.get(`${API_URL}/api/tests/${testId}`, authHeader());
            const testDetails = testDetailsResponse.data;

            setAttemptId(attempt.id);
            setTestData(questions); 
            setSelectedTest(testDetails); 

            // Инициализируем ответы с учетом типа вопроса
            if (questions && questions.length > 0) {
                 const initialAnswers = questions.reduce((acc, question) => {
                    const isEssay = question.questionType === 'ESSAY';
                    
                    acc[question.id] = {
                        questionId: question.id,
                        selectedOptionsIds: isEssay ? null : [], 
                        textAnswer: isEssay ? '' : null
                    };
                    return acc;
                }, {});
                setAnswers(initialAnswers);
            }
           
            setLoading(false);

        } catch (err) {
            console.error("Ошибка при старте сессии теста:", err);
            
            if (err.response && err.response.status === 409) {
                 // Если бэкенд все еще возвращает 409 (активная попытка или лимит)
                 setError("У вас уже есть активная попытка или вы исчерпали лимит попыток для этого теста.");
            } else if (err.response && err.response.status === 404) {
                 setError("Тест не найден или не содержит вопросов.");
            } else {
                setError("Не удалось начать сессию теста. Проверьте консоль на наличие ошибок API.");
            }
            setLoading(false);
        }
    }, []);
    

    // --- Шаг 1а: Найти тест, проверить статус и начать сессию ---
    const findAndStartTest = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Получаем список тестов
            const testsResponse = await axios.get(`${API_URL}/api/tests/course/${courseId}`, authHeader());
            const availableTests = testsResponse.data; 

            if (availableTests.length === 0) {
                setError("В этом курсе нет доступных тестов.");
                setLoading(false);
                return;
            }

            const test = availableTests[0]; 
            setSelectedTest(test);
            
            // 2. ПРОВЕРКА: Если тест уже сдан, отображаем результат и прекращаем
            const isAlreadySubmitted = await checkIfSubmittedAndGetResult(test);
            
            if (isAlreadySubmitted) {
                return;
            }

            // 3. Начинаем попытку
            await startTestSession(test.id);

        } catch (err) {
            console.error("Ошибка при поиске/старте теста:", err);
            setError("Не удалось найти или начать тест. Проверьте подключение и наличие тестов.");
            setLoading(false);
        }
    }, [courseId, startTestSession, checkIfSubmittedAndGetResult]); 
    
    
    useEffect(() => {
        findAndStartTest();
    }, [findAndStartTest]);

    // ---------------------------------------------------------------------------------
    // Рендеринг (Без изменений)
    // ---------------------------------------------------------------------------------

    // Состояние: Загрузка
    if (loading && !testData && !result) {
        return <div className="container py-5 mt-5 text-center"><FaHourglassHalf className="me-2 text-primary" /> Подготовка к тесту...</div>;
    }
    
    // Состояние: Ошибка
    if (error) {
        return (
            <div className="container py-5 mt-5">
                <div className="alert alert-danger" role="alert">
                    <FaExclamationTriangle className="me-2" /> {error}
                </div>
                <button className="btn btn-secondary mt-3" onClick={onBack}>
                    Вернуться к "Моему обучению"
                </button>
            </div>
        );
    }
    
    // Состояние: Результаты (Тест сдан или был сдан ранее)
    if (submitted && result) {
        const isPassed = result.isPassed; 
        const isGraded = result.isGraded;
        const icon = isPassed ? <FaCheckCircle /> : <FaTimesCircle />;
        const statusText = isPassed ? 'УСПЕШНО СДАН' : 'НЕ СДАН';
        const resultClass = isPassed ? 'alert-success' : 'alert-danger';
        
        return (
            <div className="container py-5 mt-5">
                <h2 className="mb-4">
                    <FaClipboardCheck className="me-3 text-primary" /> 
                    Результаты теста: {courseTitle}
                </h2>
                <div className={`alert ${resultClass}`}>
                    {icon} 
                    Тест **{selectedTest?.title || '—'}** **УЖЕ ВЫПОЛНЕН** и имеет статус: {statusText}!
                </div>
                <div className="card shadow-sm">
                    <div className="card-body">
                        <p><strong>Дата завершения:</strong> {result.finishedAt ? new Date(result.finishedAt).toLocaleDateString() : '—'}</p>
                        <p><strong>Ваш балл:</strong> {result.totalScore} / {result.maxScore}</p>
                        {!isGraded && (
                            <p className="text-warning">
                                <FaHourglassHalf className="me-1" />
                                Ваши ответы на открытые вопросы отправлены на проверку преподавателю.
                            </p>
                        )}
                    </div>
                </div>
                <button className="btn btn-secondary mt-4" onClick={onBack}>
                    Вернуться к "Моему обучению"
                </button>
            </div>
        );
    }
    
    // Состояние: Прохождение теста
    if (testData && !submitted) {
        return (
            <div className="container py-5" style={{ marginTop: '80px' }}>
                <h1 className="mb-4">{courseTitle}</h1>
                <h2 className="mb-4 text-secondary">Тест: {selectedTest?.title || '—'}</h2>
                
                {selectedTest?.durationMinutes > 0 && (
                    <Timer 
                        initialTime={selectedTest.durationMinutes} 
                        onSubmitTest={handleSubmitTest} 
                    />
                )}

                {testData.length === 0 ? (
                    <div className="alert alert-info">Этот тест пока не содержит вопросов.</div>
                ) : (
                    <>
                        {testData.map((question, index) => (
                            <QuestionComponent 
                                key={question.id}
                                question={question}
                                index={index}
                                answers={answers}
                                setAnswers={setAnswers}
                                submitted={submitted}
                            />
                        ))}
                        
                        <button 
                            className="btn btn-lg btn-success w-100 mt-4" 
                            onClick={handleSubmitTest}
                            disabled={submitted || loading}
                        >
                            Завершить и отправить тест
                        </button>
                    </>
                )}
            </div>
        );
    }
    
    return null; 
};