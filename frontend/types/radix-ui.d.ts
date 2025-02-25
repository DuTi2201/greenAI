declare module '@radix-ui/react-alert-dialog' {
  import * as React from 'react';
  
  type PrimitiveButtonProps = React.ComponentPropsWithoutRef<'button'> & {
    asChild?: boolean;
  };
  
  type PrimitiveDivProps = React.ComponentPropsWithoutRef<'div'> & {
    asChild?: boolean;
  };
  
  // Root
  export const Root: React.FC<{
    children?: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>;
  
  // Trigger
  export const Trigger: React.ForwardRefExoticComponent<
    PrimitiveButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
  
  // Portal
  export const Portal: React.FC<{
    children?: React.ReactNode;
    container?: HTMLElement;
    forceMount?: boolean;
  }>;
  
  // Overlay
  export const Overlay: React.ForwardRefExoticComponent<
    PrimitiveDivProps & React.RefAttributes<HTMLDivElement>
  >;
  
  // Content
  export const Content: React.ForwardRefExoticComponent<
    PrimitiveDivProps & React.RefAttributes<HTMLDivElement>
  >;
  
  // Title
  export const Title: React.ForwardRefExoticComponent<
    PrimitiveDivProps & React.RefAttributes<HTMLDivElement>
  >;
  
  // Description
  export const Description: React.ForwardRefExoticComponent<
    PrimitiveDivProps & React.RefAttributes<HTMLDivElement>
  >;
  
  // Action
  export const Action: React.ForwardRefExoticComponent<
    PrimitiveButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
  
  // Cancel
  export const Cancel: React.ForwardRefExoticComponent<
    PrimitiveButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
} 