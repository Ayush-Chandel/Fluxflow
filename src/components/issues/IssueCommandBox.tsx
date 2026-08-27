import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { buttonVariants } from '../ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';

type OptionMeta = { label: string; icon: React.ReactNode };

type Props<T extends string> = {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly T[];
    map: Record<T, OptionMeta>;
    placeholder?: string;
    triggerClassName?: string;
    label?:string;
    contentAlign?: 'start' | 'center' | 'end';
    /** Gives the trigger a short confirmation pulse after a different option is chosen. */
    pulseOnValueChange?: boolean;
};

function IssueCommandBox<T extends string>({
    value,
    onValueChange,
    options,
    map,
    placeholder = 'Change value to...',
    triggerClassName = '!px-2',
    label,
    contentAlign = 'start',
    pulseOnValueChange = false,
}: Props<T>) {
    const [open, setOpen] = React.useState(false);
    const [highlighted, setHighlighted] = React.useState('');
    const pulseControls = useAnimationControls();

    const selectOption = (option: T) => {
        if (pulseOnValueChange && option !== value) {
            void pulseControls.start({
                scale: [0.85, 1.16, 1],
                opacity: [0.70, 1, 1],
                transition: { duration: 0.28, times: [0, 0.5, 1], ease: 'easeOut' },
            });
        }

        onValueChange(option);
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) setHighlighted(map[value]?.label ?? '');
            }}
        >
            <PopoverTrigger asChild>
                <motion.button
                    type='button'
                    data-slot='button'
                    data-variant='default'
                    data-size='default'
                    className={cn(buttonVariants({ variant: 'default' }), triggerClassName)}
                    onClick={(e) => e.stopPropagation()}
                    initial={false}
                    animate={pulseControls}
                >
                    {map[value].icon}
                    {label &&
                    <span>
                        {label}
                    </span>
                    }
                </motion.button>
            </PopoverTrigger>
            <PopoverContent side='bottom' align={contentAlign} className="w-60 bg-surface p-0 border-0">
                <Command
                    value={highlighted}
                    onValueChange={setHighlighted}
                    className="max-w-sm rounded-lg border bg-surface "
                >
                    <CommandInput className='text-lsm text-foreground' placeholder={placeholder} />
                    <CommandList>
                        <CommandEmpty className='text-lsm text-foreground'>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option, index) => (
                                <CommandItem
                                    key={`${option}-${index}`}
                                    value={map[option].label}
                                    className={cn(
                                        'flex justify-between items-center',
                                        option === value && '!bg-brand/10',
                                    )}
                                    onSelect={() => selectOption(option)}>
                                    <div className='flex gap-2 items-center text-lsm text-foreground'>
                                        {map[option].icon}
                                        <span>{map[option].label}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default IssueCommandBox;
