'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, Globe, Settings, BarChart3, Download } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI-Powered Threat Detector</h1>
                <p className="text-sm text-gray-500">Advanced Browser Security</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/popup" className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 hover:scale-105 transform">
                Popup Demo
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 hover:scale-105 transform">
                Dashboard
              </Link>
              <Link href="/settings" className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 hover:scale-105 transform">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-strong">
                <Shield className="w-20 h-20 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse-custom"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            Threat Detector
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed animate-fade-in">
            Protect yourself from online threats with our advanced browser extension that uses
            <span className="font-semibold text-red-600"> AI and threat intelligence APIs</span> to detect
            phishing, malware, and suspicious behavior in real-time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <button
              type="button"
              className="btn-primary flex items-center justify-center gap-3 px-8 py-4 text-lg shadow-strong hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Download className="w-6 h-6" />
              Install Extension
            </button>
            <Link
              href="/dashboard"
              className="btn-outline flex items-center justify-center gap-3 px-8 py-4 text-lg shadow-soft hover:shadow-md transform hover:scale-105 transition-all duration-200"
            >
              <BarChart3 className="w-6 h-6" />
              View Dashboard
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>AI-Powered Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Privacy Focused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Core Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced protection powered by AI and threat intelligence APIs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Phishing Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time URL scanning using Google Safe Browsing API and AI-based classification
                to detect phishing attempts before you fall victim.
              </p>
              <div className="mt-4 flex items-center text-sm text-orange-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Malware Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Scans download links using VirusTotal API and warns before downloads from
                suspicious sources to prevent malware infections.
              </p>
              <div className="mt-4 flex items-center text-sm text-red-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Anomaly Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered behavioral analysis detects unusual activity like excessive redirects
                and suspicious JavaScript execution.
              </p>
              <div className="mt-4 flex items-center text-sm text-purple-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Threat Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive dashboard displaying logs of detected threats, statistics,
                and management tools for whitelisted and blacklisted sites.
              </p>
              <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customizable Settings</h3>
              <p className="text-gray-600 leading-relaxed">
                Fine-tune protection levels, manage API keys, and configure whitelist/blacklist
                domains according to your security preferences.
              </p>
              <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="card card-hover p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Continuous monitoring and instant warnings ensure you're protected
                from threats as soon as they're detected.
              </p>
              <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Technology Stack</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technologies and industry-leading APIs for maximum security
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl font-bold text-white">N</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Next.js</h3>
              <p className="text-sm text-gray-600">React Framework</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl font-bold text-white">T</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">TensorFlow.js</h3>
              <p className="text-sm text-gray-600">AI/ML Library</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl font-bold text-white">G</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Google Safe Browsing</h3>
              <p className="text-sm text-gray-600">Threat Intelligence</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl font-bold text-white">V</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">VirusTotal</h3>
              <p className="text-sm text-gray-600">Malware Detection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold">AI-Powered Threat Detector</span>
            </div>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              Protecting users from online threats with advanced AI and threat intelligence.
              Your security is our priority.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <Link
                href="/popup"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hover:scale-105 transform"
              >
                Popup Demo
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hover:scale-105 transform"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 hover:scale-105 transform"
              >
                Settings
              </Link>
            </div>

            {/* Security badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Enterprise Ready</span>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500 text-sm">
                © 2024 AI-Powered Threat Detector. Built with ❤️ for a safer internet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
