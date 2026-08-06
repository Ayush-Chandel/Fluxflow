import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
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
}: Props<T>) {
    const [open, setOpen] = React.useState(false);
    const [highlighted, setHighlighted] = React.useState('');

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) setHighlighted(map[value]?.label ?? '');
            }}
        >
            <PopoverTrigger asChild className={triggerClassName}>
                <Button variant="default" onClick={(e) => e.stopPropagation()}>
                    {map[value].icon}
                    {label &&
                    <span>
                        {label}
                    </span>
                    }
                </Button>
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
                                    onSelect={() => {
                                        onValueChange(option);
                                        setOpen(false);
                                    }}>
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
