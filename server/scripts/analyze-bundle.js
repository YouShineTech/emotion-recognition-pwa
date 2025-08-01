#!/usr/bin/env node

/**
 * Bundle Analysis Script for Emotion Recognition PWA Server
 * Analyzes the compiled server bundle for size, dependencies, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');

class BundleAnalyzer {
  constructor(options = {}) {
    this.options = {
      bundlePath: options.bundlePath || './dist',
      outputFile: options.outputFile || './reports/bundle-analysis.json',
      includeNodeModules: options.includeNodeModules !== false,
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB
      analyzeDependencies: options.analyzeDependencies !== false
    };

    this.analysis = {
      generatedAt: new Date().toISOString(),
      summary: {},
      files: [],
      dependencies: {},
      recommendations: []
    };
  }

  async analyzeBundle() {
    console.log(chalk.blue('📦 Analyzing Server Bundle...'));

    if (!fs.existsSync(this.options.bundlePath)) {
      throw new Error(`Bundle path not found: ${this.options.bundlePath}`);
    }

    await this.scanDirectory(this.options.bundlePath);
    this.generateSummary();
    this.analyzeDependencies();
    this.generateRecommendations();
    await this.saveAnalysis();
    this.displayAnalysis();
  }

  async scanDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        await this.scanDirectory(fullPath, itemRelativePath);
      } else if (stats.isFile() && this.isJavaScriptFile(item)) {
        await this.analyzeFile(fullPath, itemRelativePath, stats);
      }
    }
  }

  isJavaScriptFile(filename) {
    return /\.(js|mjs|cjs)$/.test(filename);
  }

  async analyzeFile(filePath, relativePath, stats) {
    const content = fs.readFileSync(filePath, 'utf8');
    const size = stats.size;
    const lines = content.split('\n').length;

    const fileAnalysis = {
      path: relativePath,
      size: size,
      sizeFormatted: this.formatBytes(size),
      lines: lines,
      imports: this.extractImports(content),
      dependencies: this.extractDependencies(content),
      complexity: this.calculateComplexity(content)
    };

    this.analysis.files.push(fileAnalysis);

    // Track dependencies
    if (this.options.analyzeDependencies) {
      this.trackDependencies(fileAnalysis.dependencies, relativePath);
    }
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

    let match;

    // ES6 imports
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  extractDependencies(imports) {
    const dependencies = [];

    for (const importPath of imports) {
      if (importPath.startsWith('.')) {
        // Local dependency
        dependencies.push({
          type: 'local',
          path: importPath,
          size: 0 // Will be calculated later
        });
      } else if (!importPath.startsWith('@') && !importPath.includes('/')) {
        // Node.js built-in module
        dependencies.push({
          type: 'builtin',
          path: importPath,
          size: 0
        });
      } else {
        // External dependency
        dependencies.push({
          type: 'external',
          path: importPath,
          size: 0
        });
      }
    }

    return dependencies;
  }

  calculateComplexity(content) {
    let complexity = 0;

    // Count functions
    const functionMatches = content.match(/function\s+\w+|=>\s*{|class\s+\w+/g);
    complexity += functionMatches ? functionMatches.length : 0;

    // Count conditional statements
    const conditionalMatches = content.match(/if\s*\(|else\s*if|switch\s*\(|case\s+/g);
    complexity += conditionalMatches ? conditionalMatches.length : 0;

    // Count loops
    const loopMatches = content.match(/for\s*\(|while\s*\(|do\s*\{/g);
    complexity += loopMatches ? loopMatches.length : 0;

    return complexity;
  }

  trackDependencies(dependencies, sourceFile) {
    for (const dep of dependencies) {
      const key = dep.path;
      if (!this.analysis.dependencies[key]) {
        this.analysis.dependencies[key] = {
          type: dep.type,
          path: key,
          usageCount: 0,
          usedBy: [],
          size: 0
        };
      }

      this.analysis.dependencies[key].usageCount++;
      this.analysis.dependencies[key].usedBy.push(sourceFile);
    }
  }

  generateSummary() {
    const totalSize = this.analysis.files.reduce((sum, file) => sum + file.size, 0);
    const totalLines = this.analysis.files.reduce((sum, file) => sum + file.lines, 0);
    const totalComplexity = this.analysis.files.reduce((sum, file) => sum + file.complexity, 0);

    this.analysis.summary = {
      totalFiles: this.analysis.files.length,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      totalLines: totalLines,
      totalComplexity: totalComplexity,
      averageFileSize: totalSize / this.analysis.files.length,
      averageLinesPerFile: totalLines / this.analysis.files.length,
      averageComplexity: totalComplexity / this.analysis.files.length,
      largestFile: this.analysis.files.reduce((max, file) =>
        file.size > max.size ? file : max, { size: 0 }),
      mostComplexFile: this.analysis.files.reduce((max, file) =>
        file.complexity > max.complexity ? file : max, { complexity: 0 })
    };
  }

  analyzeDependencies() {
    if (!this.options.analyzeDependencies) return;

    const dependencyStats = {
      total: Object.keys(this.analysis.dependencies).length,
      byType: {
        local: 0,
        builtin: 0,
        external: 0
      },
      mostUsed: [],
      largest: []
    };

    for (const [key, dep] of Object.entries(this.analysis.dependencies)) {
      dependencyStats.byType[dep.type]++;
    }

    // Find most used dependencies
    dependencyStats.mostUsed = Object.values(this.analysis.dependencies)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    this.analysis.dependencyStats = dependencyStats;
  }

  generateRecommendations() {
    const recommendations = [];

    // Large files
    const largeFiles = this.analysis.files.filter(file => file.size > this.options.maxFileSize);
    if (largeFiles.length > 0) {
      recommendations.push({
        category: 'File Size',
        severity: 'medium',
        message: `${largeFiles.length} files exceed ${this.formatBytes(this.options.maxFileSize)}. Consider code splitting or optimization.`,
        files: largeFiles.map(f => f.path)
      });
    }

    // Complex files
    const complexFiles = this.analysis.files.filter(file => file.complexity > 50);
    if (complexFiles.length > 0) {
      recommendations.push({
        category: 'Complexity',
        severity: 'medium',
        message: `${complexFiles.length} files have high complexity. Consider refactoring for maintainability.`,
        files: complexFiles.map(f => f.path)
      });
    }

    // Duplicate dependencies
    if (this.options.analyzeDependencies) {
      const duplicateDeps = Object.values(this.analysis.dependencies)
        .filter(dep => dep.usageCount > 3);

      if (duplicateDeps.length > 0) {
        recommendations.push({
          category: 'Dependencies',
          severity: 'low',
          message: `${duplicateDeps.length} dependencies are used in multiple files. Consider creating shared modules.`,
          dependencies: duplicateDeps.map(d => d.path)
        });
      }
    }

    this.analysis.recommendations = recommendations;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async saveAnalysis() {
    const outputDir = path.dirname(this.options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(this.options.outputFile, JSON.stringify(this.analysis, null, 2));
    console.log(chalk.green(`✓ Analysis saved to: ${this.options.outputFile}`));
  }

  displayAnalysis() {
    console.log(chalk.blue('\n📊 Bundle Analysis Summary'));
    console.log(chalk.gray('='.repeat(50)));

    // Summary table
    const summaryTable = new Table({
      head: ['Metric', 'Value'],
      colWidths: [25, 25]
    });

    summaryTable.push(
      ['Total Files', this.analysis.summary.totalFiles],
      ['Total Size', this.analysis.summary.totalSizeFormatted],
      ['Total Lines', this.analysis.summary.totalLines.toLocaleString()],
      ['Total Complexity', this.analysis.summary.totalComplexity],
      ['Avg File Size', this.formatBytes(this.analysis.summary.averageFileSize)],
      ['Avg Lines/File', Math.round(this.analysis.summary.averageLinesPerFile)],
      ['Avg Complexity', Math.round(this.analysis.summary.averageComplexity)]
    );

    console.log(summaryTable.toString());

    // Largest files
    console.log(chalk.yellow('\n📁 Largest Files:'));
    const largestFiles = this.analysis.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    const fileTable = new Table({
      head: ['File', 'Size', 'Lines', 'Complexity'],
      colWidths: [30, 15, 10, 12]
    });

    largestFiles.forEach(file => {
      fileTable.push([
        file.path,
        file.sizeFormatted,
        file.lines.toString(),
        file.complexity.toString()
      ]);
    });

    console.log(fileTable.toString());

    // Dependencies summary
    if (this.options.analyzeDependencies && this.analysis.dependencyStats) {
      console.log(chalk.cyan('\n🔗 Dependencies Summary:'));
      console.log(`Total: ${this.analysis.dependencyStats.total}`);
      console.log(`Local: ${this.analysis.dependencyStats.byType.local}`);
      console.log(`Built-in: ${this.analysis.dependencyStats.byType.builtin}`);
      console.log(`External: ${this.analysis.dependencyStats.byType.external}`);

      if (this.analysis.dependencyStats.mostUsed.length > 0) {
        console.log(chalk.cyan('\nMost Used Dependencies:'));
        this.analysis.dependencyStats.mostUsed.slice(0, 5).forEach((dep, index) => {
          console.log(`${index + 1}. ${dep.path} (${dep.usageCount} uses)`);
        });
      }
    }

    // Recommendations
    if (this.analysis.recommendations.length > 0) {
      console.log(chalk.yellow('\n⚠️  Recommendations:'));
      this.analysis.recommendations.forEach((rec, index) => {
        console.log(chalk.yellow(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`));
      });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bundle-path':
        options.bundlePath = args[++i];
        break;
      case '--output-file':
        options.outputFile = args[++i];
        break;
      case '--max-file-size':
        options.maxFileSize = parseInt(args[++i]) || 1024 * 1024;
        break;
      case '--no-dependencies':
        options.analyzeDependencies = false;
        break;
      case '--help':
        console.log(`
Bundle Analyzer for Emotion Recognition PWA Server

Usage: node analyze-bundle.js [options]

Options:
  --bundle-path <path>    Path to bundle directory (default: ./dist)
  --output-file <path>    Output analysis file path (default: ./reports/bundle-analysis.json)
  --max-file-size <bytes> Maximum file size threshold (default: 1048576)
  --no-dependencies       Skip dependency analysis
  --help                  Show this help message

Examples:
  node analyze-bundle.js
  node analyze-bundle.js --bundle-path ./build --output-file ./reports/bundle-report.json
        `);
        process.exit(0);
    }
  }

  const analyzer = new BundleAnalyzer(options);
  analyzer.analyzeBundle().catch(error => {
    console.error(chalk.red(`Error analyzing bundle: ${error.message}`));
    process.exit(1);
  });
}

module.exports = BundleAnalyzer;
