/**
 * Shared Dependency Validation Utilities
 *
 * Common utilities for validating modular interface architecture
 * across client and server test suites.
 */
export interface DependencyGraph {
    [interfaceName: string]: string[];
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ModuleImportInfo {
    file: string;
    imports: string[];
    usedTypes: string[];
}
/**
 * Build a dependency graph from interface files
 */
export declare function buildInterfaceDependencyGraph(interfacesDir: string): DependencyGraph;
/**
 * Detect circular dependencies using DFS
 */
export declare function detectCircularDependencies(dependencies: DependencyGraph): ValidationResult;
/**
 * Analyze module imports to ensure they only import what they use
 */
export declare function analyzeModuleImports(moduleFiles: string[]): ModuleImportInfo[];
/**
 * Validate that no central export hubs exist
 */
export declare function validateNoCentralHubs(interfacesDir: string): ValidationResult;
/**
 * Validate single responsibility principle for interface files
 */
export declare function validateSingleResponsibility(interfacesDir: string): ValidationResult;
/**
 * Validate that modules use explicit import paths
 */
export declare function validateExplicitImports(moduleFiles: string[]): ValidationResult;
/**
 * Calculate interface impact - which modules would be affected by interface changes
 */
export declare function calculateInterfaceImpact(interfacesDir: string, moduleFiles: string[]): Map<string, string[]>;
/**
 * Validate tree-shaking compatibility
 */
export declare function validateTreeShakingCompatibility(moduleFiles: string[]): ValidationResult;
/**
 * Generate a comprehensive validation report
 */
export declare function generateValidationReport(interfacesDir: string, clientModuleFiles: string[], serverModuleFiles: string[]): ValidationResult;
//# sourceMappingURL=dependency-validation.utils.d.ts.map