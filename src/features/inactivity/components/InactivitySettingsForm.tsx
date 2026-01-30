"use client";

import { useState } from "react";
import { useInactivitySettings, useUpdateInactivitySettings } from "../api/useInactivitySettings";
import {
    LadderInactivitySettings,
    DEFAULT_INACTIVITY_SETTINGS,
    PenaltyType,
    CalculationMethod,
    FloorType,
} from "@/types/inactivity";

interface InactivitySettingsFormProps {
    ladderId: string;
    isEditing?: boolean;
}

export function InactivitySettingsForm({ ladderId, isEditing = true }: InactivitySettingsFormProps) {
    const { data: settingsData, isLoading } = useInactivitySettings(ladderId);
    const updateSettings = useUpdateInactivitySettings(ladderId);

    const settings = settingsData || DEFAULT_INACTIVITY_SETTINGS;

    const [formData, setFormData] = useState<Partial<LadderInactivitySettings>>(settings);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateSettings.mutateAsync(formData);
    };

    const handleChange = (field: keyof LadderInactivitySettings, value: any) => {
        setFormData((prev: Partial<LadderInactivitySettings>) => ({ ...prev, [field]: value }));
    };

    if (isLoading) {
        return <div className="animate-pulse">Loading settings...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Master Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Inactivity Penalty System
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Automatically penalize players who haven't played in a while
                        </p>
                    </div>
                    <label className={`relative inline-flex items-center cursor-pointer ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                            type="checkbox"
                            checked={formData.enabled ?? false}
                            onChange={(e) => handleChange("enabled", e.target.checked)}
                            disabled={!isEditing}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {formData.enabled && (
                <fieldset disabled={!isEditing} className="contents space-y-6 block">
                    {/* Calculation Method & Thresholds */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Inactivity Detection</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Calculation Method
                                </label>
                                <select
                                    value={formData.calculation_method}
                                    onChange={(e) => handleChange("calculation_method", e.target.value as CalculationMethod)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="rolling_30_days">Rolling 30 Days</option>
                                    <option value="calendar_month">Calendar Month</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formData.calculation_method === "rolling_30_days"
                                        ? "Checks last 30 days from today"
                                        : "Checks activity within current month"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Inactivity Threshold (days)
                                </label>
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={formData.threshold_days}
                                    onChange={(e) => handleChange("threshold_days", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Players inactive for this many days will be penalized
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Member Grace Period (days)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="90"
                                    value={formData.new_member_grace_days}
                                    onChange={(e) => handleChange("new_member_grace_days", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    New members won't be penalized for this many days
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Penalty Configuration */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Penalty Configuration</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Penalty Type
                                </label>
                                <select
                                    value={formData.penalty_type}
                                    onChange={(e) => handleChange("penalty_type", e.target.value as PenaltyType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="rank_drop">Rank Drop</option>
                                    <option value="percentage_drop">Percentage Drop</option>
                                    <option value="point_deduction">Point Deduction</option>
                                    <option value="relegation">Relegation to Bottom</option>
                                    <option value="removal">Remove from Ladder</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Penalty Severity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.penalty_severity}
                                    onChange={(e) => handleChange("penalty_severity", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formData.penalty_type === "rank_drop" && "Number of ranks to drop"}
                                    {formData.penalty_type === "percentage_drop" && "Percentage of ladder to drop"}
                                    {formData.penalty_type === "point_deduction" && "Points to deduct"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Penalty Frequency
                                </label>
                                <select
                                    value={formData.penalty_frequency}
                                    onChange={(e) => handleChange("penalty_frequency", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="once">Once (until they play again)</option>
                                    <option value="monthly">Monthly (recurring)</option>
                                    <option value="per_period">Every Period</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Protection Floor */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Protection Floor</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Prevent players from dropping below a certain rank
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.floor_enabled ?? false}
                                    onChange={(e) => handleChange("floor_enabled", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.floor_enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Floor Type
                                    </label>
                                    <select
                                        value={formData.floor_type}
                                        onChange={(e) => handleChange("floor_type", e.target.value as FloorType)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="percentage">Percentage of Ladder</option>
                                        <option value="absolute_rank">Absolute Rank</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Floor Value
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={formData.floor_type === "percentage" ? 100 : 1000}
                                        value={formData.floor_value}
                                        onChange={(e) => handleChange("floor_value", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formData.floor_type === "percentage"
                                            ? "Cannot drop below this % of ladder"
                                            : "Cannot drop below this rank"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Warn players before applying penalties
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.notify_before_penalty ?? false}
                                    onChange={(e) => handleChange("notify_before_penalty", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.notify_before_penalty && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Warning Days Before Penalty
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={formData.notification_days_before}
                                    onChange={(e) => handleChange("notification_days_before", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Players will be notified this many days before penalty
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Leave System */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Leave of Absence System</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Allow players to pause inactivity penalties
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.leave_system_enabled ?? false}
                                    onChange={(e) => handleChange("leave_system_enabled", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.leave_system_enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Vacation Leaves/Year
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={formData.max_vacation_leaves_per_year}
                                        onChange={(e) => handleChange("max_vacation_leaves_per_year", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Injury Leaves/Year
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={formData.max_injury_leaves_per_year}
                                        onChange={(e) => handleChange("max_injury_leaves_per_year", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Work/Travel Leaves/Year
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={formData.max_work_leaves_per_year}
                                        onChange={(e) => handleChange("max_work_leaves_per_year", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Personal Leaves/Year
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        value={formData.max_personal_leaves_per_year}
                                        onChange={(e) => handleChange("max_personal_leaves_per_year", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>
            )}

            {/* Save Button */}
            {
                isEditing && (
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setFormData(settings)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            disabled={updateSettings.isPending}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={updateSettings.isPending}
                        >
                            {updateSettings.isPending ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                )
            }

            {
                updateSettings.isSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-200">
                        Settings saved successfully!
                    </div>
                )
            }

            {
                updateSettings.isError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200">
                        Failed to save settings. Please try again.
                    </div>
                )
            }
        </form >
    );
}
