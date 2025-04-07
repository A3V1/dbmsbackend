/**
 * Dashboard Styles - Dynamic CSS injection for the Mentor-Mentee Management System
 */

(function() {
    // Create a style element
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    
    // Add dynamic CSS
    styleEl.textContent = `
        /* Card styles with dynamic hover effects */
        .mentee-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(37, 99, 235, 0.1);
            border-left: 3px solid var(--primary-color);
        }
        
        .task-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(249, 115, 22, 0.1);
            border-left: 3px solid var(--secondary-color);
        }
        
        .meeting-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(6, 182, 212, 0.1);
            border-left: 3px solid var(--accent-color);
        }
        
        .message-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(34, 211, 238, 0.1);
            border-left: 3px solid #22d3ee;
        }
        
        /* Status indicators */
        .status-success {
            background-color: #e6f6e6;
            color: var(--success-color);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-info {
            background-color: #e3f2fd;
            color: var(--info-color);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-warning {
            background-color: #fff3e0;
            color: var(--warning-color);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-danger {
            background-color: #ffebee;
            color: var(--danger-color);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        /* Improved headers */
        .dashboard-header {
            background-image: linear-gradient(to right, var(--primary-light), white);
            padding: 16px 24px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        
        /* Grid for stats */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }
        
        @media (max-width: 992px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (max-width: 576px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Mentee card styles */
        .mentee-card {
            display: flex;
            flex-direction: column;
        }
        
        .mentee-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .mentee-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
        }
        
        /* Task card styles */
        .task-card {
            border-left: 3px solid transparent;
        }
        
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .task-meta {
            display: flex;
            gap: 12px;
            margin-top: 8px;
            color: var(--light-text);
            font-size: 12px;
        }
        
        /* Meeting card styles */
        .meeting-card {
            border-left: 3px solid transparent;
        }
        
        .meeting-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .meeting-meta {
            display: flex;
            gap: 12px;
            margin-top: 8px;
            color: var(--light-text);
            font-size: 12px;
        }
        
        /* Message card styles */
        .message-card {
            border-left: 3px solid transparent;
        }
        
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .message-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .message-time {
            color: var(--light-text);
            font-size: 12px;
        }
        
        /* Chart container */
        .chart-container {
            height: 300px;
            padding: 16px;
        }
        
        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 40px 16px;
            color: var(--light-text);
        }
        
        .empty-state i {
            font-size: 48px;
            margin-bottom: 16px;
            color: var(--gray);
        }
        
        /* Scrollable containers */
        .scrollable {
            max-height: 400px;
            overflow-y: auto;
            padding: 0 16px;
        }
        
        .scrollable::-webkit-scrollbar {
            width: 6px;
        }
        
        .scrollable::-webkit-scrollbar-track {
            background: var(--gray-light);
        }
        
        .scrollable::-webkit-scrollbar-thumb {
            background-color: var(--gray);
            border-radius: 3px;
        }
        
        /* Responsive design adjustments */
        @media (max-width: 768px) {
            .task-meta, .meeting-meta {
                flex-direction: column;
                gap: 4px;
            }
            
            .mentee-header {
                flex-direction: column;
            }
            
            .mentee-info {
                margin-left: 0;
                margin-top: 8px;
            }
        }
    `;
})(); 